import WebKit

enum PageScripts {

    /// The web app is the other half of the mic problem.
    ///
    /// Even with the native shell staying awake, a page that listens for
    /// `visibilitychange` will happily mute or tear down its own tracks the
    /// moment iOS reports the view as hidden. From the page's point of view
    /// nothing has changed here: the shell is still running and the capture
    /// session is still open, so we keep reporting the document as visible and
    /// swallow the events that would trigger a self-mute.
    ///
    /// Element-level `blur` is deliberately left alone — intercepting it at the
    /// window capture phase would break ordinary form focus handling.
    static let keepPageVisible = """
    (function () {
      if (window.__commzVisibilityPatched) { return; }
      window.__commzVisibilityPatched = true;

      function pin(proto, prop, value) {
        try {
          Object.defineProperty(proto, prop, {
            get: function () { return value; },
            configurable: true
          });
        } catch (e) { /* non-configurable in this engine; the event block still applies */ }
      }

      [Document.prototype, document].forEach(function (target) {
        pin(target, 'hidden', false);
        pin(target, 'visibilityState', 'visible');
        pin(target, 'webkitHidden', false);
        pin(target, 'webkitVisibilityState', 'visible');
      });

      try { document.hasFocus = function () { return true; }; } catch (e) {}

      var muted = ['visibilitychange', 'webkitvisibilitychange', 'freeze', 'pagehide'];
      muted.forEach(function (name) {
        [window, document].forEach(function (target) {
          target.addEventListener(name, function (event) {
            event.stopImmediatePropagation();
          }, true);
        });
      });
    })();
    """

    static func userScripts() -> [WKUserScript] {
        var scripts: [WKUserScript] = []

        if AppConfig.spoofPageVisibility {
            scripts.append(WKUserScript(source: keepPageVisible,
                                        injectionTime: .atDocumentStart,
                                        forMainFrameOnly: false))
        }

        return scripts
    }
}
