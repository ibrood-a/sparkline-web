# Commz iOS wrapper

> Picking this up fresh? Read [HANDOFF.md](HANDOFF.md) first — it covers what is
> verified, what is not, and the open question the project turns on.

A native iOS shell around [app.commz.net](https://app.commz.net), built to solve one
specific problem: **the microphone must stay live when you leave the app.**

The project is generated from `project.yml` with
[XcodeGen](https://github.com/yonaskolb/XcodeGen), so there is no `.xcodeproj` in
source control. CI builds an unsigned IPA on every push that touches `ios/`.

## Why the PWA mutes, and what this does about it

In a PWA the mic dies because Safari itself is suspended by iOS the moment you
switch away. Nothing the page does can prevent that. A native shell can, but only
if several things line up — all of them are handled here:

| Layer | What it does | Where |
| --- | --- | --- |
| `UIBackgroundModes: audio` | Lets the process keep running once backgrounded. | `Commz/Info.plist` |
| `AVAudioSession` `.playAndRecord` / `.voiceChat` | A recording-capable session, re-applied on route changes, interruptions and media-services resets — WebKit reconfigures the session itself when `getUserMedia` starts, so setting it once at launch is not enough. | `AudioSessionManager.swift` |
| Inaudible keep-alive loop | iOS suspends the process anyway if the audio session is merely *active* rather than actually moving audio. A silent generated WAV loops for exactly as long as the page holds the mic. It has to start while the app is still in the foreground — background audio cannot be started from a suspended process. | `AudioSessionManager.swift` |
| `microphoneCaptureState` KVO | Detects the page taking and releasing the mic, with no cooperation needed from the web app. Drives the two rows above, plus the idle timer. | `WebViewController.swift` |
| Track monitor | Reports every `mute`/`unmute`/`ended` on the mic track back to the native log, so a failure is visible instead of inferred. | `PageScripts.swift` |
| Visibility spoofing | The other half of the problem: a web app that listens for `visibilitychange` will mute *itself* when iOS reports the view as hidden, no matter what the shell does. The page is told it is always visible and those events are swallowed. | `PageScripts.swift` |

`requestMediaCapturePermissionFor` grants capture to `*.commz.net` after the system
prompt is answered, so there is no second in-page permission dialog.

### How confident is this?

Partly. The mechanism is real but the field reports conflict, so this is a strong
attempt rather than a guarantee:

- **Worked** — a developer reports the mic staying live in a web-view shell while
  backgrounded, even with the screen off.
- **Failed** — a Capacitor developer with both `audio` *and* `voip` background
  modes declared still lost the mic in the background.
- **Untested** — the WebKit source reading that traced the decision to the host
  app's background-audio capability was never confirmed on a real device.

Rows 1 and 2 differ by *something*, and the plist is not it, since the failing
case had more of it than the working one. The two candidates are the keep-alive
and the page muting itself on `visibilitychange` — neither appears in either
report, and both are handled here. That is the bet this app makes.

`voip` is deliberately **not** declared: it did not save the failing case, and
Apple rejects it without a real CallKit/PushKit integration.

### Verifying it on device

Shake the device to toggle a diagnostic overlay. It shows the live
capture state, whether the keep-alive is running, the audio category and the
current output route, over a log of recent events.

The log is the part that matters. Every `mute`, `unmute` and `ended` on the
microphone track is reported from the page, interleaved with the app's own
background/foreground transitions, so the failure has a timestamp instead of
being someone saying "I can't hear you". A `track audio mute` landing right after
`app backgrounded (mic LIVE)` is the exact thing this app exists to prevent.

Run all four, confirming on a second device that you are still audible:

| Test | What to watch |
| --- | --- |
| Home screen, 30s+ | Orange mic dot stays lit; no `track audio mute` in the log |
| Screen locked, 1 min | Same — this is the harsher case |
| Real incoming phone call | Interruption logged, then capture resumes after |
| Another app for 5 min | Audio survives; watch for a *disconnect* instead (see below) |

If a test fails, flip the mitigations off one at a time via `UserDefaults`
(`CommzSpoofPageVisibility`, `CommzBackgroundKeepAlive`, `CommzDefaultToSpeaker`,
`CommzFastTaps`)
to find which one was carrying it — or which one caused it.

### If it still fails

The escalation is to stop routing audio through the web view at all: LiveKit's
native Swift SDK for capture and playback, driven by CallKit so iOS treats a
lobby as a real call, with the web view kept for everything else. That is a much
larger change — the voice path stops being web code — which is exactly why it is
worth spending an hour on this build first.

### Known limits

Background **JavaScript timers are still throttled** by WebKit even while capture
continues. Audio keeps flowing, but if the web app holds its session open with a
frequent JS heartbeat, that heartbeat may slow down while you are in another app.
So the five-minute test above is looking for a different failure mode than the
others: not a muted mic, but LiveKit deciding the client went away. If that shows
up, the fix is server-side — a longer participant timeout — not anything the
shell can do.

Apple also rejects pure web-view wrappers under App Store guideline 4.2, so this
is built for sideloading. Proper TestFlight or App Store distribution needs a paid
developer account, and review would judge the wrapper on its own merits.

## Building

### CI

`.github/workflows/ios-build.yml` runs on `macos-latest` and produces
`Commz-unsigned-ipa` as a build artifact on every push touching `ios/`.

Run it manually with **publish_release = true** to also attach the IPA to an
`ios-latest` prerelease, which gives a stable download URL instead of an artifact
that expires after 90 days.

GitHub-hosted runners have no signing identity, so the IPA is **unsigned**. Install
it with a tool that re-signs on the way in:

- **Sideloadly** or **AltStore** (free Apple ID — app expires every 7 days)
- **Apple Developer account** (paid — 1 year), or an MDM/enterprise profile

### Locally

```bash
brew install xcodegen
cd ios
xcodegen generate
open Commz.xcodeproj
```

Set your team in Signing & Capabilities and run on a device. The simulator cannot
capture real microphone input in a useful way, and background behaviour there does
not match a device — test this one on hardware.

## Configuration

`Commz/Sources/AppConfig.swift` holds the start URL, the domains treated as
first-party, the shell's background colour and the runtime toggles.
