import Combine
import Foundation
import LiveKit
import WebKit

/// Screen sharing for a page that cannot do it itself.
///
/// iOS web views have no `getDisplayMedia`, and the only way an iOS app can share
/// the whole screen — other apps included — is a ReplayKit broadcast extension
/// (`CommzBroadcast`). LiveKit's extension forwards frames to this app, which
/// publishes them from a second, native LiveKit room connection.
///
/// That connection cannot be the user: Commz gives each user one LiveKit
/// identity, and a second connection with it would kick their voice. The page
/// fetches a token for `<userId>:screen` (screen video only, subscribes to
/// nothing) from `POST /api/channels/:id/voice/screen-token` and hands it over
/// here; the page then shows that participant's track as the user's share.
///
/// Page → app:  `webkit.messageHandlers.commzScreenShare.postMessage({action: 'start', url, token})`
///              `… .postMessage({action: 'stop'})`
/// App → page:  `commz:native-screenshare` event, `detail.state` one of
///              `connecting`, `started`, `stopped`, `error` (with `detail.message`).
@MainActor
final class ScreenShareBridge {

    static let handlerName = "commzScreenShare"

    weak var webView: WKWebView?

    private var room: Room?
    private var broadcastWatch: AnyCancellable?
    private var sawBroadcast = false
    private var pickerTimeout: Task<Void, Never>?

    /// How long to wait for the user to tap Start Broadcast before giving up.
    private static let pickerTimeoutSeconds: UInt64 = 90

    func handle(_ body: [String: Any]) {
        switch body["action"] as? String {
        case "start":
            guard let url = body["url"] as? String,
                  let token = body["token"] as? String,
                  url.hasPrefix("wss://") || url.hasPrefix("ws://"),
                  !token.isEmpty else {
                report("error", "The screen share could not be authorised.")
                return
            }
            Task { await start(url: url, token: token) }
        case "stop":
            Task { await stop(reportState: true) }
        default:
            break
        }
    }

    private func start(url: String, token: String) async {
        await stop(reportState: false)
        let room = Room()
        self.room = room
        sawBroadcast = false
        report("connecting", nil)

        do {
            // VP8 is encoded in software. The iPhone's hardware H.264 encoder is not
            // available to an app in the background, which is exactly when a screen
            // share is running, and a stalled encoder freezes the share on its last
            // frame. 15 fps keeps the software encoder's CPU cost reasonable.
            let publish = VideoPublishOptions(
                screenShareEncoding: VideoEncoding(maxBitrate: 1_500_000, maxFps: 15),
                simulcast: false,
                preferredCodec: .vp8)
            try await room.connect(url: url,
                                   token: token,
                                   connectOptions: ConnectOptions(autoSubscribe: false),
                                   roomOptions: RoomOptions(defaultVideoPublishOptions: publish))
            watchBroadcast()
            // Shows the system "Screen Broadcast" sheet. The track is published
            // once the user taps Start Broadcast; tapping outside cancels.
            try await room.localParticipant.setScreenShare(enabled: true)
            DebugLog.shared.log("screen share: broadcast picker shown")

            pickerTimeout = Task { [weak self] in
                try? await Task.sleep(nanoseconds: ScreenShareBridge.pickerTimeoutSeconds * 1_000_000_000)
                guard let self = self, !Task.isCancelled, !self.sawBroadcast, self.room === room else { return }
                DebugLog.shared.log("screen share: no broadcast started, closing")
                await self.stop(reportState: true)
            }
        } catch {
            DebugLog.shared.log("screen share failed: \(error.localizedDescription)")
            await stop(reportState: false)
            report("error", "Could not start screen sharing: \(error.localizedDescription)")
        }
    }

    private func watchBroadcast() {
        broadcastWatch = BroadcastManager.shared.isBroadcastingPublisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] broadcasting in
                Task { @MainActor in self?.broadcastChanged(broadcasting) }
            }
    }

    private func broadcastChanged(_ broadcasting: Bool) {
        guard room != nil else { return }
        if broadcasting {
            sawBroadcast = true
            AudioSessionManager.shared.setScreenShareActive(true)
            pickerTimeout?.cancel()
            pickerTimeout = nil
            DebugLog.shared.log("screen share: broadcasting")
            report("started", nil)
        } else if sawBroadcast {
            // Stopped from the status bar or Control Center.
            Task { await stop(reportState: true) }
        }
    }

    private func stop(reportState: Bool) async {
        pickerTimeout?.cancel()
        pickerTimeout = nil
        broadcastWatch = nil
        AudioSessionManager.shared.setScreenShareActive(false)

        if let room = room {
            self.room = nil
            _ = try? await room.localParticipant.setScreenShare(enabled: false)
            await room.disconnect()
            DebugLog.shared.log("screen share stopped")
        }
        if reportState { report("stopped", nil) }
    }

    private func report(_ state: String, _ message: String?) {
        var detail: [String: Any] = ["state": state]
        if let message = message { detail["message"] = message }
        guard let data = try? JSONSerialization.data(withJSONObject: detail),
              let json = String(data: data, encoding: .utf8) else { return }
        webView?.evaluateJavaScript(
            "window.dispatchEvent(new CustomEvent('commz:native-screenshare', { detail: \(json) }));",
            completionHandler: nil)
    }
}
