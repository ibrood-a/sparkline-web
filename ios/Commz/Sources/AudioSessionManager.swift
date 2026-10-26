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
///     suspends the process anyway. So we play inaudible audio for as long as
///     the page holds the microphone.
///
/// Background audio cannot be started once the app is already suspended, so the
/// keep-alive starts the moment capture begins, not when we background.
final class AudioSessionManager {

    static let shared = AudioSessionManager()

    private let session = AVAudioSession.sharedInstance()
    private var keepAlivePlayer: AVAudioPlayer?

    /// Set by the web view's KVO on `microphoneCaptureState`.
    private(set) var isCaptureActive = false

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
    }

    /// Called whenever the page starts or stops using the microphone.
    func setCaptureActive(_ active: Bool) {
        guard active != isCaptureActive else { return }
        isCaptureActive = active

        if active {
            // Deliberately hands-off by default. By the time this runs WebKit has
            // already configured the session and started the input unit, and
            // calling setCategory on a live capture tears that unit down — the
            // track stays open and stops carrying any audio, which the page sees
            // as "no microphone input detected" while sitting in a call.
            //
            // So the shell adds only the two things WebKit cannot: an inaudible
            // stream so iOS keeps the process alive in the background, and an
            // output-only route preference.
            if AppConfig.manageAudioSession {
                configureSession(forCapture: true)
                activateSession()
            }
            applyPreferredRoute()
            startKeepAlive()
        } else {
            stopKeepAlive()
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
    ///
    /// WebKit also reconfigures the session itself when `getUserMedia` starts,
    /// which is why this is re-applied on every relevant transition rather than
    /// once at launch.
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
        applyPreferredRoute()
    }

    /// Force the speaker rather than the earpiece.
    ///
    /// `.defaultToSpeaker` is only a *default*, and `.voiceChat` mode overrides it
    /// back to the receiver — that mode is built for held-to-the-ear calls. For a
    /// voice lobby the speaker is what people expect, so the route is overridden
    /// outright once the session is live.
    ///
    /// Headphones, Bluetooth and CarPlay are left alone: forcing the speaker while
    /// someone is on AirPods would be worse than the bug being fixed.
    private func applyPreferredRoute() {
        guard AppConfig.defaultToSpeaker else { return }

        let externalPorts: Set<AVAudioSession.Port> = [
            .headphones, .bluetoothA2DP, .bluetoothHFP, .bluetoothLE,
            .carAudio, .usbAudio, .airPlay, .headsetMic
        ]
        let usingExternal = session.currentRoute.outputs.contains { externalPorts.contains($0.portType) }

        do {
            try session.overrideOutputAudioPort(usingExternal ? .none : .speaker)
        } catch {
            DebugLog.shared.log("route override failed: \(error.localizedDescription)")
        }
    }

    private func deactivateSession() {
        // Let other apps resume, but never fight WebKit if it still holds the session.
        try? session.setActive(false, options: [.notifyOthersOnDeactivation])
    }

    /// Apply a live change to the keep-alive toggle without waiting for the next
    /// call to start.
    func refreshKeepAlive() {
        guard isCaptureActive else { return }
        if AppConfig.backgroundKeepAlive {
            startKeepAlive()
        } else {
            stopKeepAlive()
        }
    }

    // MARK: - Inaudible keep-alive

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

    // MARK: - System events

    @objc private func handleInterruption(_ note: Notification) {
        guard let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }

        switch type {
        case .began:
            DebugLog.shared.log("audio interrupted")
        case .ended:
            let optionsRaw = note.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
            let shouldResume = AVAudioSession.InterruptionOptions(rawValue: optionsRaw).contains(.shouldResume)
            DebugLog.shared.log("audio interruption ended (resume: \(shouldResume))")
            guard isCaptureActive else { return }
            // An interruption does stop our player, so the session has to be
            // reactivated here regardless of who owns the category.
            activateSession()
            keepAlivePlayer?.play()
        @unknown default:
            break
        }
    }

    @objc private func handleRouteChange(_ note: Notification) {
        guard isCaptureActive else { return }
        // Re-assert the output route only. Re-setting the category here would hit
        // a live capture unit, which is the thing we are avoiding.
        if AppConfig.manageAudioSession {
            configureSession(forCapture: true)
            activateSession()
        }
        applyPreferredRoute()
        if keepAlivePlayer?.isPlaying == false { keepAlivePlayer?.play() }
        DebugLog.shared.log("route -> \(session.currentRoute.outputs.first?.portType.rawValue ?? "none")")
    }

    @objc private func handleMediaServicesReset(_ note: Notification) {
        DebugLog.shared.log("media services reset")
        keepAlivePlayer = nil
        guard isCaptureActive else { return }
        configureSession(forCapture: true)
        activateSession()
        startKeepAlive()
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
        keepalive: \(keepAlivePlayer?.isPlaying == true ? "on" : "off")
        category: \(session.category.rawValue.replacingOccurrences(of: "AVAudioSessionCategory", with: ""))
        out: \(route.replacingOccurrences(of: "AVAudioSessionPort", with: ""))
        """
    }
}
