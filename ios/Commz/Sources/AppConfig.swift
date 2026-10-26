import Foundation
import UIKit

/// Build-time and user-overridable configuration for the wrapper.
enum AppConfig {

    /// The page the app opens on launch.
    static let startURL = URL(string: "https://app.commz.net")!

    /// Marketing site, used as a fallback if the app host is unreachable.
    static let fallbackURL = URL(string: "https://commz.net")!

    /// Hosts that are treated as "ours" and always stay inside the main web view.
    /// Suffix match, so `app.commz.net` and `cdn.commz.net` both qualify.
    static let primaryDomains = ["commz.net"]

    /// Background colour behind the web view (matches the site's dark chrome).
    static let backgroundColor = UIColor(red: 0.043, green: 0.051, blue: 0.067, alpha: 1.0)

    /// Appended to the default WKWebView user agent so the site can detect the native shell.
    static var userAgentSuffix: String {
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
        return "Safari/604.1 CommzNative/\(version)"
    }

    // MARK: - Runtime toggles
    //
    // These default to on. They can be flipped without a rebuild from the debug
    // overlay (three-finger tap) so a misbehaving page can be ruled out quickly.

    private static func flag(_ key: String, default defaultValue: Bool) -> Bool {
        UserDefaults.standard.object(forKey: key) == nil
            ? defaultValue
            : UserDefaults.standard.bool(forKey: key)
    }

    /// Hide `visibilitychange` from the page so its own JS does not mute the mic
    /// when the app is backgrounded. This is the single most important toggle
    /// for "my mic cuts out when I leave the app".
    static var spoofPageVisibility: Bool {
        get { flag(Keys.spoofVisibility, default: true) }
        set { UserDefaults.standard.set(newValue, forKey: Keys.spoofVisibility) }
    }

    /// Play inaudible audio while the microphone is live, so iOS keeps the
    /// process running (and therefore the capture session open) in the background.
    static var backgroundKeepAlive: Bool {
        get { flag(Keys.keepAlive, default: true) }
        set { UserDefaults.standard.set(newValue, forKey: Keys.keepAlive) }
    }

    /// Remove WebKit's wait-and-see delay before every tap.
    static var fastTaps: Bool {
        get { flag(Keys.fastTaps, default: true) }
        set { UserDefaults.standard.set(newValue, forKey: Keys.fastTaps) }
    }

    /// Route to the speaker rather than the earpiece by default.
    static var defaultToSpeaker: Bool {
        get { flag(Keys.speaker, default: true) }
        set { UserDefaults.standard.set(newValue, forKey: Keys.speaker) }
    }

    /// Show the diagnostic overlay.
    static var debugHUD: Bool {
        get { flag(Keys.debugHUD, default: false) }
        set { UserDefaults.standard.set(newValue, forKey: Keys.debugHUD) }
    }

    enum Keys {
        static let spoofVisibility = "CommzSpoofPageVisibility"
        static let keepAlive = "CommzBackgroundKeepAlive"
        static let fastTaps = "CommzFastTaps"
        static let speaker = "CommzDefaultToSpeaker"
        static let debugHUD = "CommzDebugHUD"
    }
}

extension AppConfig {
    /// Suffix match against `primaryDomains`.
    static func isPrimaryHost(_ host: String) -> Bool {
        let host = host.lowercased()
        return primaryDomains.contains { host == $0 || host.hasSuffix(".\($0)") }
    }
}

extension URL {
    /// True when the URL belongs to one of the app's own domains.
    var isPrimaryDomain: Bool {
        guard let host = host else { return false }
        return AppConfig.isPrimaryHost(host)
    }
}
