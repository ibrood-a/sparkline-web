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
    private let reloadButton = UIButton(type: .system)
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

        reloadButton.setTitle("Reload", for: .normal)
        reloadButton.titleLabel?.font = .monospacedSystemFont(ofSize: 10, weight: .semibold)
        reloadButton.addTarget(self, action: #selector(reloadTapped), for: .touchUpInside)

        let stack = UIStackView(arrangedSubviews: [statusLabel, logLabel, reloadButton])
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

    /// The overlay floats over the page, so everything except the button has to
    /// be transparent to touches — otherwise it quietly swallows taps on whatever
    /// the page is drawing underneath it.
    override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
        let inButton = reloadButton.point(inside: convert(point, to: reloadButton), with: event)
        return inButton && !reloadButton.isHidden
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
