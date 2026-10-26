import UIKit
import WebKit

/// Host for `window.open` targets — chiefly third-party sign-in flows.
///
/// It reuses the configuration WebKit hands us, which is what keeps the popup on
/// the same cookie store as the main web view; an `SFSafariViewController` here
/// would hand back a session the app can't see.
final class PopupWebViewController: UIViewController {

    let webView: WKWebView

    init(configuration: WKWebViewConfiguration) {
        self.webView = WKWebView(frame: .zero, configuration: configuration)
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        view.backgroundColor = AppConfig.backgroundColor

        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        view.addSubview(webView)

        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])

        navigationItem.leftBarButtonItem = UIBarButtonItem(barButtonSystemItem: .done,
                                                           target: self,
                                                           action: #selector(done))
        navigationItem.rightBarButtonItem = UIBarButtonItem(title: "Safari",
                                                            style: .plain,
                                                            target: self,
                                                            action: #selector(openInSafari))
    }

    @objc private func done() {
        dismiss(animated: true)
    }

    @objc private func openInSafari() {
        guard let url = webView.url else { return }
        UIApplication.shared.open(url)
    }
}

extension PopupWebViewController: WKNavigationDelegate {

    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {

        if let url = navigationAction.request.url,
           let scheme = url.scheme?.lowercased(),
           scheme != "http", scheme != "https" {
            decisionHandler(.cancel)
            UIApplication.shared.open(url)
            return
        }

        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        title = webView.url?.host
    }
}

extension PopupWebViewController: WKUIDelegate {

    func webViewDidClose(_ webView: WKWebView) {
        dismiss(animated: true)
    }
}
