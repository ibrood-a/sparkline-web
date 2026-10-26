import AVFoundation
import UIKit
import WebKit

final class WebViewController: UIViewController {

    private var webView: WKWebView!
    private let progressBar = UIProgressView(progressViewStyle: .bar)
    private let errorView = ErrorView()
    private var hud: DebugHUD?

    private var observations: [NSKeyValueObservation] = []

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()

        view.backgroundColor = AppConfig.backgroundColor

        setUpWebView()
        setUpChrome()
        observeWebView()
        observeAppLifecycle()

        if AppConfig.debugHUD { showHUD() }

        // Permission first, page second — see `primeMicrophoneAccess`.
        primeMicrophoneAccess { [weak self] in
            self?.load(AppConfig.startURL)
        }
    }

    // MARK: - Microphone permission

    /// Settle the system microphone permission *before* the first page load.
    ///
    /// A settings screen listing input devices calls `enumerateDevices()`, and
    /// WebKit returns nothing usable from it until the host app holds microphone
    /// permission. Waiting for the page to call `getUserMedia` is too late: by then
    /// the device list has already been built and shown as empty, which reads to
    /// the user as "it can't find my mic".
    private func primeMicrophoneAccess(then continuation: @escaping () -> Void) {
        switch AVCaptureDevice.authorizationStatus(for: .audio) {
        case .authorized:
            DebugLog.shared.log("mic permission: already granted")
            continuation()

        case .notDetermined:
            DebugLog.shared.log("mic permission: asking")
            AVCaptureDevice.requestAccess(for: .audio) { granted in
                DispatchQueue.main.async {
                    DebugLog.shared.log("mic permission: \(granted ? "granted" : "denied")")
                    continuation()
                }
            }

        case .denied, .restricted:
            DebugLog.shared.log("mic permission: denied at the system level")
            continuation()
            presentMicrophoneDeniedAlert()

        @unknown default:
            continuation()
        }
    }

    /// Nothing in the web app can recover from a system-level denial, so say so
    /// plainly rather than letting the page report a missing microphone.
    private func presentMicrophoneDeniedAlert() {
        let alert = UIAlertController(
            title: "Microphone is off",
            message: "Commz can't use your microphone because access is turned off in iOS Settings. Voice lobbies won't pick you up until it's enabled.",
            preferredStyle: .alert)

        alert.addAction(UIAlertAction(title: "Not now", style: .cancel))
        alert.addAction(UIAlertAction(title: "Open Settings", style: .default) { _ in
            guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
            UIApplication.shared.open(url)
        })

        present(alert, animated: true)
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        UIDevice.current.userInterfaceIdiom == .pad ? .all : [.portrait, .landscapeLeft, .landscapeRight]
    }

    // MARK: - Web view

    private func setUpWebView() {
        let configuration = WKWebViewConfiguration()

        // Persistent store so the login survives app restarts.
        configuration.websiteDataStore = .default()
        configuration.processPool = WKProcessPool()

        // Voice and video have to be able to start without a synthetic tap, and
        // must never be promoted to the fullscreen native player.
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.allowsAirPlayForMediaPlayback = true
        configuration.allowsPictureInPictureMediaPlayback = true

        // Default UA plus a Safari token (some sites gate WebRTC on it) and our marker.
        configuration.applicationNameForUserAgent = "Mobile/15E148 \(AppConfig.userAgentSuffix)"

        let controller = WKUserContentController()
        PageScripts.userScripts().forEach(controller.addUserScript)
        controller.add(ScriptMessageProxy(self), name: PageScripts.trackMonitorHandlerName)
        configuration.userContentController = controller

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        webView.uiDelegate = self
        // Deliberately off: the edge-swipe gesture steals horizontal drags from
        // the page's own drawers and sliders, which is worse than losing "back"
        // in an app that has its own navigation.
        webView.allowsBackForwardNavigationGestures = false
        webView.isOpaque = false
        webView.backgroundColor = AppConfig.backgroundColor
        webView.scrollView.backgroundColor = AppConfig.backgroundColor
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        // The site lays itself out to the viewport; rubber-banding the whole app
        // just makes the shell look broken.
        webView.scrollView.bounces = false

        #if DEBUG
        if #available(iOS 16.4, *) { webView.isInspectable = true }
        #endif

        view.addSubview(webView)

        // Pinned to the safe area vertically so the composer never sits under the
        // home indicator, and edge to edge horizontally.
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
    }

    private func setUpChrome() {
        progressBar.translatesAutoresizingMaskIntoConstraints = false
        progressBar.progressTintColor = .systemIndigo
        progressBar.trackTintColor = .clear
        progressBar.alpha = 0
        // It sits over the top edge of the page; it must never eat a tap.
        progressBar.isUserInteractionEnabled = false
        view.addSubview(progressBar)

        errorView.translatesAutoresizingMaskIntoConstraints = false
        errorView.isHidden = true
        errorView.onRetry = { [weak self] in self?.retry() }
        view.addSubview(errorView)

        NSLayoutConstraint.activate([
            progressBar.topAnchor.constraint(equalTo: webView.topAnchor),
            progressBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            progressBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            progressBar.heightAnchor.constraint(equalToConstant: 2),

            errorView.topAnchor.constraint(equalTo: webView.topAnchor),
            errorView.bottomAnchor.constraint(equalTo: webView.bottomAnchor),
            errorView.leadingAnchor.constraint(equalTo: webView.leadingAnchor),
            errorView.trailingAnchor.constraint(equalTo: webView.trailingAnchor)
        ])

        // No gesture recognizer for the overlay. A UITapGestureRecognizer on the
        // root view delays every single-finger tap (delaysTouchesEnded defaults to
        // true) while it waits to see whether more fingers are coming, which makes
        // the whole page feel like it needs a second tap. Shake toggles it instead
        // — nothing in the touch path at all. See `motionEnded`.
    }

    private func observeWebView() {
        observations.append(webView.observe(\.estimatedProgress, options: [.new]) { [weak self] webView, _ in
            self?.updateProgress(webView.estimatedProgress)
        })

        // The whole point of the app: react to the page taking and releasing the
        // microphone so the audio session is live *before* we ever background.
        observations.append(webView.observe(\.microphoneCaptureState, options: [.new, .initial]) { [weak self] webView, _ in
            AudioSessionManager.shared.setCaptureActive(webView.microphoneCaptureState == .active)
            self?.hud?.refresh()
        })

        observations.append(webView.observe(\.cameraCaptureState, options: [.new]) { [weak self] webView, _ in
            DebugLog.shared.log("camera: \(webView.cameraCaptureState == .active ? "active" : "idle")")
            self?.hud?.refresh()
        })
    }

    private func observeAppLifecycle() {
        let center = NotificationCenter.default
        center.addObserver(self, selector: #selector(didEnterBackground),
                           name: UIApplication.didEnterBackgroundNotification, object: nil)
        center.addObserver(self, selector: #selector(willEnterForeground),
                           name: UIApplication.willEnterForegroundNotification, object: nil)
    }

    // MARK: - Navigation

    private func load(_ url: URL) {
        errorView.isHidden = true
        webView.load(URLRequest(url: url))
    }

    private func retry() {
        if webView.url != nil {
            errorView.isHidden = true
            webView.reload()
        } else {
            load(AppConfig.startURL)
        }
    }

    /// Rebuild the injected scripts, then reload.
    ///
    /// User scripts are evaluated at document start and installed once, so a
    /// plain reload would re-run whatever was registered at launch. Toggling one
    /// of them off has to re-register the set or the toggle does nothing.
    func reload() {
        let controller = webView.configuration.userContentController
        controller.removeAllUserScripts()
        PageScripts.userScripts().forEach(controller.addUserScript)
        retry()
    }

    private func updateProgress(_ progress: Double) {
        progressBar.setProgress(Float(progress), animated: true)

        if progress >= 1.0 {
            UIView.animate(withDuration: 0.25,
                           delay: 0.1,
                           options: [],
                           animations: { self.progressBar.alpha = 0 },
                           completion: { _ in self.progressBar.setProgress(0, animated: false) })
        } else if progressBar.alpha == 0 {
            UIView.animate(withDuration: 0.15, animations: { self.progressBar.alpha = 1 })
        }
    }

    // MARK: - App lifecycle

    @objc private func didEnterBackground() {
        DebugLog.shared.log("app backgrounded (mic \(AudioSessionManager.shared.isCaptureActive ? "LIVE" : "idle"))")
    }

    @objc private func willEnterForeground() {
        DebugLog.shared.log("app foregrounded (mic \(AudioSessionManager.shared.isCaptureActive ? "LIVE" : "idle"))")
        hud?.refresh()
    }

    // MARK: - Debug overlay

    override var canBecomeFirstResponder: Bool { true }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        becomeFirstResponder()
    }

    /// Shake to toggle the diagnostic overlay.
    override func motionEnded(_ motion: UIEvent.EventSubtype, with event: UIEvent?) {
        guard motion == .motionShake else {
            super.motionEnded(motion, with: event)
            return
        }
        toggleHUD()
    }

    @objc private func toggleHUD() {
        if hud == nil {
            AppConfig.debugHUD = true
            showHUD()
        } else {
            AppConfig.debugHUD = false
            hud?.removeFromSuperview()
            hud = nil
        }
    }

    private func showHUD() {
        let overlay = DebugHUD()
        overlay.translatesAutoresizingMaskIntoConstraints = false
        overlay.onReload = { [weak self] in self?.reload() }
        view.addSubview(overlay)

        NSLayoutConstraint.activate([
            overlay.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8),
            overlay.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 8),
            overlay.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -8)
        ])

        hud = overlay
        overlay.refresh()
    }
}

// MARK: - WKNavigationDelegate

extension WebViewController: WKNavigationDelegate {

    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {

        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }

        // tel:, mailto:, itms-apps: and friends belong to the system.
        if let scheme = url.scheme?.lowercased(), scheme != "http", scheme != "https" {
            decisionHandler(.cancel)
            UIApplication.shared.open(url)
            return
        }

        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        errorView.isHidden = true
        hud?.refresh()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        show(error)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        show(error)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        DebugLog.shared.log("web content process terminated — reloading")
        webView.reload()
    }

    private func show(_ error: Error) {
        let nsError = error as NSError

        // A navigation the user or the page replaced is not a failure worth a screen.
        guard nsError.code != NSURLErrorCancelled else { return }

        DebugLog.shared.log("load failed: \(nsError.code) \(nsError.localizedDescription)")
        progressBar.alpha = 0
        errorView.message = nsError.localizedDescription
        errorView.isHidden = false
    }
}

// MARK: - WKUIDelegate

extension WebViewController: WKUIDelegate {

    /// Grant mic/camera to our own site without a second in-page prompt — the
    /// user already answered the system one.
    func webView(_ webView: WKWebView,
                 requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo,
                 type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {

        guard AppConfig.isPrimaryHost(origin.host) else {
            decisionHandler(.prompt)
            return
        }

        var mediaTypes: [AVMediaType] = []
        switch type {
        case .microphone: mediaTypes = [.audio]
        case .camera: mediaTypes = [.video]
        case .cameraAndMicrophone: mediaTypes = [.audio, .video]
        @unknown default: mediaTypes = [.audio]
        }

        requestSystemAccess(to: mediaTypes) { granted in
            DebugLog.shared.log("capture permission \(granted ? "granted" : "denied") for \(origin.host)")
            decisionHandler(granted ? .grant : .deny)
        }
    }

    private func requestSystemAccess(to mediaTypes: [AVMediaType], completion: @escaping (Bool) -> Void) {
        guard let mediaType = mediaTypes.first else {
            completion(true)
            return
        }
        let remaining = Array(mediaTypes.dropFirst())

        switch AVCaptureDevice.authorizationStatus(for: mediaType) {
        case .authorized:
            requestSystemAccess(to: remaining, completion: completion)
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: mediaType) { [weak self] granted in
                guard granted else {
                    DispatchQueue.main.async { completion(false) }
                    return
                }
                DispatchQueue.main.async { self?.requestSystemAccess(to: remaining, completion: completion) }
            }
        case .denied, .restricted:
            completion(false)
        @unknown default:
            completion(false)
        }
    }

    /// OAuth and "open in new tab" links. These stay inside the app and share the
    /// same configuration, so cookies set during a sign-in flow land on the session
    /// the main web view is using.
    func webView(_ webView: WKWebView,
                 createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {

        // A normal in-frame link with target=_blank: just follow it here.
        if navigationAction.targetFrame == nil,
           let url = navigationAction.request.url,
           url.isPrimaryDomain {
            webView.load(navigationAction.request)
            return nil
        }

        let popup = PopupWebViewController(configuration: configuration)
        let nav = UINavigationController(rootViewController: popup)
        nav.modalPresentationStyle = .formSheet
        present(nav, animated: true)
        return popup.webView
    }

    func webViewDidClose(_ webView: WKWebView) {
        presentedViewController?.dismiss(animated: true)
    }

    func webView(_ webView: WKWebView,
                 runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        presentSafely(alert, fallback: completionHandler)
    }

    func webView(_ webView: WKWebView,
                 runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        presentSafely(alert) { completionHandler(false) }
    }

    func webView(_ webView: WKWebView,
                 runJavaScriptTextInputPanelWithPrompt prompt: String,
                 defaultText: String?,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping (String?) -> Void) {
        let alert = UIAlertController(title: nil, message: prompt, preferredStyle: .alert)
        alert.addTextField { $0.text = defaultText }
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(nil) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak alert] _ in
            completionHandler(alert?.textFields?.first?.text)
        })
        presentSafely(alert) { completionHandler(nil) }
    }

    /// A panel presented while another one is already up would be dropped on the
    /// floor, leaving the page's completion handler un-called and the tab wedged.
    private func presentSafely(_ alert: UIAlertController, fallback: @escaping () -> Void) {
        guard presentedViewController == nil else {
            fallback()
            return
        }
        present(alert, animated: true)
    }
}

// MARK: - WKScriptMessageHandler

extension WebViewController: WKScriptMessageHandler {

    /// Microphone track events forwarded by `PageScripts.trackMonitor`.
    ///
    /// A `mute` arriving right after `app backgrounded` in the log is the exact
    /// failure this app exists to prevent, and is the signal to try switching the
    /// mitigations off one at a time.
    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {

        guard message.name == PageScripts.trackMonitorHandlerName,
              let body = message.body as? [String: Any],
              let event = body["event"] as? String else { return }

        var line: String

        if event == "devices" {
            // Zero inputs here, with permission granted, means WebKit is not
            // handing the page any microphone at all.
            let count = body["count"] as? Int ?? -1
            let labelled = body["labelled"] as? Int ?? -1
            let reason = body["reason"] as? String ?? "?"
            line = "devices(\(reason)): \(count) audioinput, \(labelled) labelled"
            if let error = body["error"] as? String { line = "devices(\(reason)) error: \(error)" }
        } else if let error = body["error"] as? String {
            line = "\(event): \(error)"
        } else {
            let kind = body["kind"] as? String ?? "?"
            line = "track \(kind) \(event)"
            if let readyState = body["readyState"] as? String { line += " (\(readyState))" }
            if let muted = body["muted"] as? Bool, event == "acquired" { line += " (muted: \(muted))" }
        }

        DebugLog.shared.log(line)
        hud?.refresh()
    }
}
