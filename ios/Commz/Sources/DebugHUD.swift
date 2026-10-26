import UIKit

/// Three-finger-tap diagnostic overlay.
///
/// Mostly here to answer one question on-device without a Mac attached: when you
/// background the app mid-call, does `mic: LIVE` survive? The log lines below it
/// show the background/foreground transitions alongside the capture state.
final class DebugHUD: UIView {

    var onReload: (() -> Void)?

    private let statusLabel = UILabel()
    private let logLabel = UILabel()
    private var timer: Timer?

    override init(frame: CGRect) {
        super.init(frame: frame)
        setUp()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setUp()
    }

    deinit {
        timer?.invalidate()
        NotificationCenter.default.removeObserver(self)
    }

    private func setUp() {
        backgroundColor = UIColor.black.withAlphaComponent(0.72)
        layer.cornerRadius = 10
        layer.borderWidth = 1
        layer.borderColor = UIColor.white.withAlphaComponent(0.15).cgColor

        statusLabel.font = .monospacedSystemFont(ofSize: 10, weight: .semibold)
        statusLabel.textColor = .systemGreen
        statusLabel.numberOfLines = 0

        logLabel.font = .monospacedSystemFont(ofSize: 9, weight: .regular)
        logLabel.textColor = UIColor.white.withAlphaComponent(0.75)
        logLabel.numberOfLines = 0

        let reload = UIButton(type: .system)
        reload.setTitle("Reload", for: .normal)
        reload.titleLabel?.font = .monospacedSystemFont(ofSize: 10, weight: .semibold)
        reload.addTarget(self, action: #selector(reloadTapped), for: .touchUpInside)

        let stack = UIStackView(arrangedSubviews: [statusLabel, logLabel, reload])
        stack.axis = .vertical
        stack.alignment = .leading
        stack.spacing = 4
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: topAnchor, constant: 8),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -8),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 10),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -10)
        ])

        NotificationCenter.default.addObserver(self,
                                               selector: #selector(refresh),
                                               name: DebugLog.didChange,
                                               object: nil)

        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.refresh()
        }
    }

    @objc func refresh() {
        DispatchQueue.main.async {
            let audio = AudioSessionManager.shared
            self.statusLabel.text = audio.statusDescription
            self.statusLabel.textColor = audio.isCaptureActive ? .systemGreen : UIColor.white.withAlphaComponent(0.7)
            self.logLabel.text = DebugLog.shared.recent.joined(separator: "\n")
        }
    }

    @objc private func reloadTapped() {
        onReload?()
    }
}
