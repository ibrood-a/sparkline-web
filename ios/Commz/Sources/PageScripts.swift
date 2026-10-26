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


    /// Reports the real fate of the microphone track back to the native side.
    ///
    /// Field reports on this problem disagree — some web-view shells keep the mic
    /// alive in the background, others die even with `audio` and `voip` both
    /// declared — and the disagreement is impossible to settle from the outside,
    /// because a muted track and a working one look identical until someone says
    /// "I can't hear you". `mute` / `unmute` / `ended` on the track are the ground
    /// truth, so they are forwarded to the log and the overlay.
    ///
    /// Note the page's own `document.hidden` is a lie by the time this runs (see
    /// `keepPageVisible`), so the native side timestamps foreground/background
    /// transitions itself rather than trusting anything reported from here.
    static let trackMonitor = """
    (function () {
      if (window.__commzTrackMonitor) { return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { return; }
      window.__commzTrackMonitor = true;

      function post(payload) {
        try {
          window.webkit.messageHandlers.commzTrack.postMessage(payload);
        } catch (e) { /* handler absent in this frame */ }
      }

      function watch(track) {
        if (track.__commzWatched) { return; }
        track.__commzWatched = true;

        post({ event: 'acquired', kind: track.kind, muted: track.muted });

        ['mute', 'unmute', 'ended'].forEach(function (name) {
          track.addEventListener(name, function () {
            post({ event: name, kind: track.kind, readyState: track.readyState });
          });
        });
      }

      var original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = function (constraints) {
        return original(constraints).then(function (stream) {
          try { stream.getAudioTracks().forEach(watch); } catch (e) {}
          return stream;
        });
      };
    })();
    """

    static let trackMonitorHandlerName = "commzTrack"

    static func userScripts() -> [WKUserScript] {
        var scripts: [WKUserScript] = []

        if AppConfig.spoofPageVisibility {
            scripts.append(WKUserScript(source: keepPageVisible,
                                        injectionTime: .atDocumentStart,
                                        forMainFrameOnly: false))
        }

        scripts.append(WKUserScript(source: trackMonitor,
                                    injectionTime: .atDocumentStart,
                                    forMainFrameOnly: false))

        return scripts
    }
}
