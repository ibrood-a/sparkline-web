# Handoff — Commz iOS wrapper

Written for a session picking this up on a Mac. The work so far was done in a
Linux cloud container with no Xcode and no device, which is the single biggest
constraint shaping what follows.

Branch: `claude/commz-wrapper-app-hd7h2z` · Repo: `ibrood-a/sparkline-web` · Code under `ios/`

---

## The goal, and what is actually unresolved

Wrap `app.commz.net` (a Discord-style voice app on LiveKit) in a native iOS shell
so **the microphone keeps working when the user leaves the app**, which it cannot
do in a PWA because iOS suspends Safari itself.

**That goal has not yet been demonstrated.** Five builds have shipped and all are
green, but every fix so far has been to a bug the shell itself introduced. We
have never had a clean call running long enough to test backgrounding. Do not
report the feature as working, or as failed, on the strength of anything in this
repo — nobody has observed it yet.

The last reported state, on build #5's predecessor: user is in a call, track is
live, and the web app shows **"No microphone input detected"**. Their headset mic
*did* get picked up. Build #5 contains the fix for the likely cause but **has not
been tested**.

---

## Where to start

Build and run on a real device from Xcode. The simulator is useless here: its
microphone and its background behaviour both differ from hardware.

```bash
brew install xcodegen
cd ios && xcodegen generate && open Commz.xcodeproj
```

Set a team under Signing & Capabilities, then run on a device.

**The thing a Mac unlocks that the cloud session never had: Safari Web Inspector.**
`isInspectable` is set under `#if DEBUG`, so a Debug build from Xcode exposes the
WKWebView at Safari → Develop → *device* → app.commz.net. That gives the page's
console, its LiveKit state and the real `MediaStreamTrack` objects. Every
diagnosis in this file was inferred from symptoms; with the inspector attached
they can be observed directly. Use it before writing any more Swift.

---

## Isolating the silent-microphone bug

Shake the device for the diagnostic overlay. It shows capture state, system mic
permission, audio category, output route, and a log that interleaves track
events with app background/foreground transitions. It also has live toggles, so
causes can be ruled out on-device without a rebuild:

| Button | Default | Turns off |
| --- | --- | --- |
| `SESSION` | off | Shell takeover of the audio session during capture |
| `ALIVE` | on | Inaudible keep-alive player |
| `SPKR` | on | Speaker route override |
| `VIS` | on | Visibility spoofing (reloads) |
| `TAPS` | on | `touch-action: manipulation` injection (reloads) |

If audio is still silent in a call, **toggle `ALIVE` off first**. That is the only
remaining thing the shell puts into the audio path. The result is the decision
point described at the bottom of this file.

Defaults live in `AppConfig.swift` (`UserDefaults` keys are `Commz*`).

---

## How it is meant to work

| Piece | File |
| --- | --- |
| `UIBackgroundModes: audio` — lets the process survive backgrounding | `Commz/Info.plist` |
| Inaudible keep-alive; iOS suspends a process whose session is merely *active* rather than moving audio. Must start in the foreground — background audio cannot be started once suspended | `AudioSessionManager.swift` |
| Speaker route override, output-only | `AudioSessionManager.swift` |
| KVO on `microphoneCaptureState` drives all of the above, needing nothing from the web app | `WebViewController.swift` |
| Visibility spoofing — a page that hears `visibilitychange` will mute *itself* no matter what the shell does | `PageScripts.swift` |
| Track monitor — reports `mute`/`unmute`/`ended` and `enumerateDevices()` counts to the native log | `PageScripts.swift` |

---

## Hard-won facts, so they are not re-derived

- **Do not call `setCategory`/`setActive` while capture is live.** WebKit
  configures and activates the session itself when `getUserMedia` starts. The
  capture KVO fires *after* that, so reconfiguring there tears down the running
  input unit and leaves a track that is open but silent. This was the cause of
  "no microphone input detected", and why plugging in a headset fixed it — the
  route change rebuilt the unit. Build #5 made the shell hands-off by default.
- **Never answer a route change the shell or WebKit caused.** Forcing the
  speaker is itself a route change, WebKit answers route changes by rebuilding
  its capture unit (and re-setting its category, which clears the override),
  and the shell used to re-force the speaker on *every* route change. The two
  took turns for 30–60 s after joining a lobby and again after every return to
  the app: frozen UI and glitching audio, and each override also fired
  `devicechange` in the page, which can make the web app re-open its mic.
  1.0.1 (build 2) acts only on `newDeviceAvailable` / `oldDeviceUnavailable`,
  overrides once after a 1 s settle, only when the output is the earpiece, and
  never twice within 3 s. The keep-alive starts on `willResignActive` instead of
  at capture start, so joining touches nothing. The overlay log now shows each
  route change with its reason, which is how to confirm this on a device.
- **Permission must be settled before the first page load.** A settings screen
  builds its device list from `enumerateDevices()`, and WebKit returns nothing
  usable from it until the app already holds microphone permission. Requesting it
  when the page calls `getUserMedia` is too late — the list was already built
  empty.
- **`.defaultToSpeaker` is only a default**, and `.voiceChat` mode overrides it
  back to the earpiece. Forcing the speaker needs `overrideOutputAudioPort`.
  Do not force it when headphones, Bluetooth or CarPlay are connected.
- **Never put a `UITapGestureRecognizer` on the root view.** `delaysTouchesEnded`
  defaults to true, so it holds *every* tap in the app while it waits. This made
  the whole app feel like it needed a double tap. The overlay is shake-triggered
  for this reason — keep it out of the touch path.
- **A zoomable page costs a wait before every tap** while WebKit decides whether
  a second tap means zoom. `touch-action: manipulation` on interactive elements
  removes it without losing pinch-to-zoom.
- **Any view floating over the web view must be transparent to touches.** The
  overlay overrides `point(inside:)` to accept only its buttons.
- **User scripts are installed once**, so toggling one has to re-register the set
  before reloading (`WebViewController.reload()`), not just reload.

---

## Web-app side

The UA carries `CommzNative/<version>`, so the web app can detect the shell with
`navigator.userAgent.includes('CommzNative')`. Two things worth doing there:

- Hide the "iPhone pauses the microphone while Commz is in the background"
  banner in the wrapper, where it should not apply.
- Background **JS timers stay throttled** even when audio keeps flowing. If
  LiveKit's heartbeat is driven by `setInterval`, the server may drop the
  participant after a few minutes backgrounded — with a perfectly healthy mic.
  That failure reads as "the wrapper didn't work" but is fixed server-side with a
  longer participant timeout. Rule it out before blaming the shell.

---

## CI

`.github/workflows/ios-build.yml` builds an **unsigned** IPA on `macos-latest`
for any push touching `ios/`, as a 90-day artifact. Hosted runners have no
signing identity; Sideloadly/AltStore re-sign on install. A manual run with
`publish_release: true` attaches it to an `ios-latest` prerelease for a stable
link — note **the repo is public**, so that publishes the binary publicly.

The Xcode project is generated from `project.yml` and is not in source control.

---

## The decision point

If `ALIVE` off turns out to be what restores audio, then keeping the mic alive in
the background and having a working mic are in direct conflict in this
architecture, and no further patching of the shell will resolve it. The answer is
then LiveKit's native Swift SDK for the voice path, driven by CallKit so iOS
treats a lobby as a real call, with the web view kept for everything else. That
is a much larger change — voice stops being web code — which is exactly why it
was worth trying this first.

Equally, if the mic survives backgrounding once audio works, the job is done and
the remaining work is polish. Establish which of those two worlds we are in
before building anything else.
