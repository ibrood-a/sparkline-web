# Commz iOS wrapper

A native iOS shell around [app.commz.net](https://app.commz.net), built to solve one
specific problem: **the microphone must stay live when you leave the app.**

The project is generated from `project.yml` with
[XcodeGen](https://github.com/yonaskolb/XcodeGen), so there is no `.xcodeproj` in
source control. CI builds an unsigned IPA on every push that touches `ios/`.

## Why the PWA mutes and this doesn't

In a PWA the mic dies because Safari itself is suspended by iOS the moment you
switch away. Nothing the page does can prevent that. A native shell can, but only
if several things line up — all of them are handled here:

| Layer | What it does | Where |
| --- | --- | --- |
| `UIBackgroundModes: audio` | Lets the process keep running once backgrounded. | `Commz/Info.plist` |
| `AVAudioSession` `.playAndRecord` / `.voiceChat` | A recording-capable session, re-applied on route changes, interruptions and media-services resets — WebKit reconfigures the session itself when `getUserMedia` starts, so setting it once at launch is not enough. | `AudioSessionManager.swift` |
| Inaudible keep-alive loop | iOS suspends the process anyway if the audio session is merely *active* rather than actually moving audio. A silent generated WAV loops for exactly as long as the page holds the mic. It has to start while the app is still in the foreground — background audio cannot be started from a suspended process. | `AudioSessionManager.swift` |
| `microphoneCaptureState` KVO | Detects the page taking and releasing the mic, with no cooperation needed from the web app. Drives the two rows above, plus the idle timer. | `WebViewController.swift` |
| Visibility spoofing | The other half of the problem: a web app that listens for `visibilitychange` will mute *itself* when iOS reports the view as hidden, no matter what the shell does. The page is told it is always visible and those events are swallowed. | `PageScripts.swift` |

`requestMediaCapturePermissionFor` grants capture to `*.commz.net` after the system
prompt is answered, so there is no second in-page permission dialog.

### Verifying it on device

Three-finger tap anywhere to toggle a diagnostic overlay. It shows the live
capture state, whether the keep-alive is running, the audio category and the
current output route, over a log of recent events.

Join a voice lobby, confirm `mic: LIVE`, swipe to the home screen, come back, and
read the log — `app backgrounded (mic LIVE)` followed by a still-live state is the
result you want. If something misbehaves, each mitigation can be switched off
independently via `UserDefaults` (`CommzSpoofPageVisibility`,
`CommzBackgroundKeepAlive`, `CommzDefaultToSpeaker`) to isolate the cause.

### Known limits

Background **JavaScript timers are still throttled** by WebKit even while capture
continues. Audio keeps flowing, but if the web app depends on a frequent JS
heartbeat to hold its session open, that heartbeat may slow down while you are in
another app. If disconnects show up after a few minutes in the background, that is
where to look — the fix belongs in the web app (a longer server-side timeout, or a
heartbeat driven by the audio pipeline rather than `setInterval`).

Apple also rejects pure web-view wrappers under App Store guideline 4.2, so this is
built for sideloading, not the App Store.

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
