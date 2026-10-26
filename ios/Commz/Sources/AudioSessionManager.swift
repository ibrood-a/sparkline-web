import AVFoundation
import Foundation
import UIKit

/// Keeps microphone capture alive while the app is in the background.
///
/// In a PWA the mic mutes on backgrounding because Safari itself gets suspended
/// by the OS. A native shell can opt out of that, but only if three things hold
/// at the moment the app leaves the foreground:
///
///  1. The app declares the `audio` background mode (see Info.plist).
///  2. Its `AVAudioSession` is active and in a recording-capable category.
///  3. The app is *actually* moving audio. An idle session is not enough — iOS
///     suspends the process anyway. So we play inaudible audio while the page
///     holds the microphone and the app is not in front.
///
/// The rule this class follows: while the user is looking at a call, the audio
/// session belongs to WebKit. Every change the shell makes to a live session is
/// a route or configuration change that WebKit answers by rebuilding its capture
/// unit, and that rebuild is an audible glitch. Earlier builds re-forced the
/// speaker on *every* route change — including the ones the override itself and
/// WebKit's own reconfiguration produce — so the two took turns for up to a
/// minute after joining a lobby and again after every return to the app. Now:
///
///  - the speaker override is applied once, after WebKit has settled, only when
///    the output really is the earpiece, and never twice within a few seconds;
///  - route changes are acted on only when a device was added or removed;
///  - the keep-alive starts when the user leaves the app, not while they join.
final class AudioSessionManager {

    static let shared = AudioSessionManager()

    private let session = AVAudioSession.sharedInstance()
    private var keepAlivePlayer: AVAudioPlayer?

    /// Set by the web view's KVO on `microphoneCaptureState`.
    private(set) var isCaptureActive = false

    /// True while our speaker override is in force.
    private var speakerOverridden = false
    /// When the route was last overridden; see `minimumOverrideInterval`.
    private var lastOverrideAt = Date.distantPast
    /// The one pending route check. A newer request replaces it.
    private var pendingRouteCheck: DispatchWorkItem?

    /// How long to let WebKit finish configuring and starting its own capture
    /// before the shell looks at the route.
    private static let settleDelay: TimeInterval = 1.0
    /// Never override the route more often than this. If WebKit resets the
    /// override straight back, giving up for a while is far better than a loop.
    private static let minimumOverrideInterval: TimeInterval = 3.0

    private static let externalPorts: Set<AVAudioSession.Port> = [
        .headphones, .bluetoothA2DP, .bluetoothHFP, .bluetoothLE,
        .carAudio, .usbAudio, .airPlay, .headsetMic
    ]

    private init() {}

    // MARK: - Lifecycle

    func start() {
        configureSession(forCapture: false)

        let center = NotificationCenter.default
        center.addObserver(self, selector: #selector(handleInterruption(_:)),
                           name: AVAudioSession.interruptionNotification, object: session)
        center.addObserver(self, selector: #selector(handleRouteChange(_:)),
                           name: AVAudioSession.routeChangeNotification, object: session)
        center.addObserver(self, selector: #selector(handleMediaServicesReset(_:)),
                           name: AVAudioSession.mediaServicesWereResetNotification, object: session)
        center.addObserver(self, selector: #selector(appWillResignActive),
                           name: UIApplication.willResignActiveNotification, object: nil)
        center.addObserver(self, selector: #selector(appDidBecomeActive),
                           name: UIApplication.didBecomeActiveNotification, object: nil)
    }

    /// Called (on the main thread) whenever the page starts or stops using the microphone.
    func setCaptureActive(_ active: Bool) {
        guard active != isCaptureActive else { return }
        isCaptureActive = active

        if active {
            // Hands-off by default. By the time this runs WebKit has configured
            // the session and started the input unit; calling setCategory on a
            // live capture tears that unit down and leaves a silent track.
            if AppConfig.manageAudioSession {
                configureSession(forCapture: true)
                activateSession()
            }
            // One look at the route once WebKit has settled, and nothing else.
            scheduleRouteCheck(reason: "capture started")
            // The keep-alive waits for the user to leave the app
            // (`appWillResignActive`), unless they already have.
            if UIApplication.shared.applicationState != .active {
                startKeepAlive()
            }
        } else {
            pendingRouteCheck?.cancel()
            pendingRouteCheck = nil
            stopKeepAlive()
            // WebKit's next category change clears the override; just forget it.
            speakerOverridden = false
            if AppConfig.manageAudioSession {
                deactivateSession()
                // Back to plain playback, so clips and notification sounds are
                // not stuck on the call routing until the next lobby.
                configureSession(forCapture: false)
            }
        }

        UIApplication.shared.isIdleTimerDisabled = active
        DebugLog.shared.log("capture \(active ? "started" : "stopped")")
    }

    // MARK: - Session configuration

    /// The session has two states, and using the recording one all the time is a
    /// mistake: `.playAndRecord` with `.voiceChat` is tuned for a call held to the
    /// ear, so it makes ordinary media quiet and earpiece-routed. Outside a lobby
    /// the app is just a web page that sometimes plays a clip, so it sits in
    /// `.playback` until the page actually takes the microphone.
    private func configureSession(forCapture: Bool) {
        do {
            if forCapture {
                var options: AVAudioSession.CategoryOptions = [.allowBluetooth, .allowBluetoothA2DP]
                if AppConfig.defaultToSpeaker {
                    options.insert(.defaultToSpeaker)
                }

                do {
                    try session.setCategory(.playAndRecord, mode: .voiceChat, options: options)
                } catch {
                    // `.voiceChat` rejects some option combinations on older
                    // devices; fall back so we still get record + background.
                    try session.setCategory(.playAndRecord, options: options)
                }
            } else {
                try session.setCategory(.playback, mode: .default, options: [])
            }
        } catch {
            DebugLog.shared.log("setCategory(capture: \(forCapture)) failed: \(error.localizedDescription)")
        }
    }

    private func activateSession() {
        do {
            try session.setActive(true, options: [])
        } catch {
            DebugLog.shared.log("setActive failed: \(error.localizedDescription)")
        }
        scheduleRouteCheck(reason: "session activated")
    }

    private func deactivateSession() {
        // Let other apps resume, but never fight WebKit if it still holds the session.
        try? session.setActive(false, options: [.notifyOthersOnDeactivation])
    }

    // MARK: - Speaker routing

    /// Run `applyPreferredRoute` once, after the session has had time to settle.
    /// Must be called on the main thread; a newer request replaces a pending one.
    private func scheduleRouteCheck(reason: String, after delay: TimeInterval = AudioSessionManager.settleDelay) {
        pendingRouteCheck?.cancel()
        let work = DispatchWorkItem { [weak self] in
            guard let self = self else { return }
            self.pendingRouteCheck = nil
            self.applyPreferredRoute(reason: reason)
        }
        pendingRouteCheck = work
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: work)
    }

    /// Use the speaker rather than the earpiece during a call.
    ///
    /// `.voiceChat` mode routes to the receiver because it is built for calls held
    /// to the ear; a voice lobby wants the speaker. Headphones, Bluetooth and
    /// CarPlay are left alone. The override is only applied when the output really
    /// is the earpiece: re-applying it when the speaker is already in use is what
    /// used to start the route-change loop.
    private func applyPreferredRoute(reason: String) {
        guard isCaptureActive else { return }

        let outputs = session.currentRoute.outputs.map { $0.portType }
        let usingExternal = outputs.contains { AudioSessionManager.externalPorts.contains($0) }

        if !AppConfig.defaultToSpeaker || usingExternal {
            if speakerOverridden { overrideRoute(.none, reason: reason) }
            return
        }

        guard outputs.contains(.builtInReceiver) else { return }

        guard Date().timeIntervalSince(lastOverrideAt) >= AudioSessionManager.minimumOverrideInterval else {
            DebugLog.shared.log("route override skipped (\(reason)): too soon after the last one")
            return
        }
        overrideRoute(.speaker, reason: reason)
    }

    private func overrideRoute(_ port: AVAudioSession.PortOverride, reason: String) {
        do {
            try session.overrideOutputAudioPort(port)
            speakerOverridden = (port == .speaker)
            lastOverrideAt = Date()
            DebugLog.shared.log("route override -> \(port == .speaker ? "speaker" : "none") (\(reason))")
        } catch {
            DebugLog.shared.log("route override failed: \(error.localizedDescription)")
        }
    }

    // MARK: - Inaudible keep-alive

    /// Apply a live change to the keep-alive toggle. Turning it on takes effect
    /// the next time the user leaves the app; turning it off is immediate.
    func refreshKeepAlive() {
        guard isCaptureActive else { return }
        if !AppConfig.backgroundKeepAlive {
            stopKeepAlive()
        } else if UIApplication.shared.applicationState != .active {
            startKeepAlive()
        }
    }

    private func startKeepAlive() {
        guard AppConfig.backgroundKeepAlive, keepAlivePlayer == nil else { return }

        do {
            let player = try AVAudioPlayer(data: AudioSessionManager.silentLoopWAV())
            player.numberOfLoops = -1
            player.volume = 1.0 // the samples themselves are silence
            player.prepareToPlay()
            player.play()
            keepAlivePlayer = player
            DebugLog.shared.log("keep-alive started")
        } catch {
            DebugLog.shared.log("keep-alive failed: \(error.localizedDescription)")
        }
    }

    private func stopKeepAlive() {
        guard keepAlivePlayer != nil else { return }
        keepAlivePlayer?.stop()
        keepAlivePlayer = nil
        DebugLog.shared.log("keep-alive stopped")
    }

    /// One second of silent 44.1 kHz mono PCM, wrapped in a WAV header.
    /// Generated rather than shipped so there is no binary blob in the repo.
    private static func silentLoopWAV() -> Data {
        let sampleRate = 44_100
        let channels = 1
        let bitsPerSample = 16
        let frameCount = sampleRate // 1 second
        let dataBytes = frameCount * channels * bitsPerSample / 8
        let byteRate = sampleRate * channels * bitsPerSample / 8
        let blockAlign = channels * bitsPerSample / 8

        var wav = Data()
        func ascii(_ s: String) { wav.append(contentsOf: Array(s.utf8)) }
        func u32(_ v: Int) { withUnsafeBytes(of: UInt32(v).littleEndian) { wav.append(contentsOf: $0) } }
        func u16(_ v: Int) { withUnsafeBytes(of: UInt16(v).littleEndian) { wav.append(contentsOf: $0) } }

        ascii("RIFF"); u32(36 + dataBytes); ascii("WAVE")
        ascii("fmt "); u32(16); u16(1); u16(channels)
        u32(sampleRate); u32(byteRate); u16(blockAlign); u16(bitsPerSample)
        ascii("data"); u32(dataBytes)
        wav.append(Data(count: dataBytes)) // zeroed samples == silence

        return wav
    }

    // MARK: - App events

    /// The user is leaving the app (home screen, lock, app switcher): start the
    /// keep-alive now, while the process is still in front and allowed to.
    @objc private func appWillResignActive() {
        guard isCaptureActive else { return }
        startKeepAlive()
    }

    /// Back in the app. The keep-alive keeps running until the call ends —
    /// stopping it here would be one more audio change at exactly the moment the
    /// user is listening. WebKit may have reset the route while we were away, so
    /// take one settled look at it.
    @objc private func appDidBecomeActive() {
        guard isCaptureActive else { return }
        scheduleRouteCheck(reason: "returned to app")
    }

    // MARK: - System events
    //
    // AVAudioSession posts these on its own threads; all state lives on main.

    @objc private func handleInterruption(_ note: Notification) {
        guard let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
        let optionsRaw = note.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            switch type {
            case .began:
                DebugLog.shared.log("audio interrupted")
            case .ended:
                let shouldResume = AVAudioSession.InterruptionOptions(rawValue: optionsRaw).contains(.shouldResume)
                DebugLog.shared.log("audio interruption ended (resume: \(shouldResume))")
                guard self.isCaptureActive else { return }
                // An interruption does stop our player, so the session has to be
                // reactivated here regardless of who owns the category.
                self.activateSession()
                self.keepAlivePlayer?.play()
            @unknown default:
                break
            }
        }
    }

    @objc private func handleRouteChange(_ note: Notification) {
        let raw = note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt ?? 0
        let reason = AVAudioSession.RouteChangeReason(rawValue: raw) ?? .unknown
        DispatchQueue.main.async { [weak self] in
            self?.routeChanged(reason)
        }
    }

    private func routeChanged(_ reason: AVAudioSession.RouteChangeReason) {
        guard isCaptureActive else { return }
        let output = session.currentRoute.outputs.first?.portType.rawValue ?? "none"
        DebugLog.shared.log("route -> \(output.replacingOccurrences(of: "AVAudioSessionPort", with: "")) (\(AudioSessionManager.describe(reason)))")

        switch reason {
        case .newDeviceAvailable, .oldDeviceUnavailable:
            // Headphones, Bluetooth or CarPlay came or went: worth one settled look.
            if AppConfig.manageAudioSession {
                configureSession(forCapture: true)
                activateSession() // schedules the route check
            } else {
                scheduleRouteCheck(reason: "device change")
            }
        default:
            // `.override` is our own change and `.categoryChange` /
            // `.routeConfigurationChange` are WebKit reconfiguring its capture.
            // Answering those is the loop this class exists to avoid.
            break
        }
    }

    @objc private func handleMediaServicesReset(_ note: Notification) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            DebugLog.shared.log("media services reset")
            self.keepAlivePlayer = nil
            self.speakerOverridden = false
            guard self.isCaptureActive else { return }
            self.configureSession(forCapture: true)
            self.activateSession()
            if UIApplication.shared.applicationState != .active {
                self.startKeepAlive()
            }
        }
    }

    private static func describe(_ reason: AVAudioSession.RouteChangeReason) -> String {
        switch reason {
        case .newDeviceAvailable: return "device added"
        case .oldDeviceUnavailable: return "device removed"
        case .categoryChange: return "category change"
        case .override: return "override"
        case .wakeFromSleep: return "wake"
        case .noSuitableRouteForCategory: return "no route"
        case .routeConfigurationChange: return "config change"
        case .unknown: return "unknown"
        @unknown default: return "other"
        }
    }

    // MARK: - Diagnostics

    /// System-level microphone permission, distinct from whether the page is
    /// currently capturing. A page that "can't find a microphone" is almost always
    /// this being anything other than `granted`.
    var permissionDescription: String {
        switch AVCaptureDevice.authorizationStatus(for: .audio) {
        case .authorized: return "granted"
        case .denied: return "DENIED"
        case .restricted: return "RESTRICTED"
        case .notDetermined: return "not asked"
        @unknown default: return "unknown"
        }
    }

    var statusDescription: String {
        let route = session.currentRoute.outputs.first?.portType.rawValue ?? "none"
        return """
        mic: \(isCaptureActive ? "LIVE" : "idle")  perm: \(permissionDescription)
        keepalive: \(keepAlivePlayer?.isPlaying == true ? "on" : "off")  override: \(speakerOverridden ? "speaker" : "none")
        category: \(session.category.rawValue.replacingOccurrences(of: "AVAudioSessionCategory", with: ""))
        out: \(route.replacingOccurrences(of: "AVAudioSessionPort", with: ""))
        """
    }
}
