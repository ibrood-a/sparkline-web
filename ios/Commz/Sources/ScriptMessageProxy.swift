import WebKit

/// `WKUserContentController` retains its message handlers. Registering a view
/// controller directly would make the configuration it owns own it back, so the
/// registration goes through this weak hop instead.
final class ScriptMessageProxy: NSObject, WKScriptMessageHandler {

    private weak var target: WKScriptMessageHandler?

    init(_ target: WKScriptMessageHandler) {
        self.target = target
    }

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        target?.userContentController(userContentController, didReceive: message)
    }
}
