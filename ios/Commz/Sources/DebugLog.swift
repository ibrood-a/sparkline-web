import Foundation

/// Small ring buffer of recent events, surfaced by the debug overlay.
/// Useful for confirming on-device that capture really did survive a background.
final class DebugLog {

    static let shared = DebugLog()

    static let didChange = Notification.Name("CommzDebugLogDidChange")

    private let maxEntries = 40
    private var entries: [String] = []
    private let queue = DispatchQueue(label: "net.commz.debuglog")

    private lazy var formatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "HH:mm:ss"
        return f
    }()

    private init() {}

    func log(_ message: String) {
        let line = "\(formatter.string(from: Date())) \(message)"
        NSLog("[Commz] %@", message)

        queue.sync {
            entries.append(line)
            if entries.count > maxEntries { entries.removeFirst(entries.count - maxEntries) }
        }
        NotificationCenter.default.post(name: DebugLog.didChange, object: nil)
    }

    var recent: [String] {
        queue.sync { Array(entries.suffix(8)) }
    }
}
