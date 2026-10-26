import UIKit

/// Shake-to-toggle diagnostic overlay.
///
/// Two jobs. It answers "did the microphone survive backgrounding?" from the
/// status line and the event log, and it lets each mitigation be switched off on
/// the device. The toggles matter because the failure modes here look alike from
/// the outside — a silent track, a muted track and a missing device all read as
/// "they can't hear me" — and a rebuild round-trip to rule one out is slow.
final class DebugHUD: UIView {

    var onReload: (() -> Void)?

    private let statusLabel = UILabel()
    private let logLabel = UILabel()
    private let buttonRow = UIStackView()
    private var timer: Timer?

    private struct Toggle {
        let title: String
        let isOn: () -> Bool
        let set: (Bool) -> Void
        let reloadsPage: Bool
    }

    private let toggles: [Toggle] = [
        Toggle(title: "SESSION",
               isOn: { AppConfig.manageAudioSession },
               set: { AppConfig.manageAudioSession = $0 },
               reloadsPage: false),
        Toggle(title: "ALIVE",
               isOn: { AppConfig.backgroundKeepAlive },
               set: { AppConfig.backgroundKeepAlive = $0; AudioSessionManager.shared.refreshKeepAlive() },
               reloadsPage: false),
        Toggle(title: "SPKR",
               isOn: { AppConfig.defaultToSpeaker },
               set: { AppConfig.defaultToSpeaker = $0 },
               reloadsPage: false),
        Toggle(title: "VIS",
               isOn: { AppConfig.spoofPageVisibility },
               set: { AppConfig.spoofPageVisibility = $0 },
               reloadsPage: true),
        Toggle(title: "TAPS",
               isOn: { AppConfig.fastTaps },
               set: { AppConfig.fastTaps = $0 },
               reloadsPage: true)
    ]

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
        backgroundColor = UIColor.black.withAlphaComponent(0.78)
        layer.cornerRadius = 10
        layer.borderWidth = 1
        layer.borderColor = UIColor.white.withAlphaComponent(0.15).cgColor

        statusLabel.font = .monospacedSystemFont(ofSize: 10, weight: .semibold)
        statusLabel.numberOfLines = 0

        logLabel.font = .monospacedSystemFont(ofSize: 9, weight: .regular)
        logLabel.textColor = UIColor.white.withAlphaComponent(0.75)
        logLabel.numberOfLines = 0

        buttonRow.axis = .horizontal
        buttonRow.spacing = 4
        buttonRow.distribution = .fillProportionally

        for (index, toggle) in toggles.enumerated() {
            let button = UIButton(type: .system)
            button.tag = index
            button.titleLabel?.font = .monospacedSystemFont(ofSize: 9, weight: .bold)
            button.layer.cornerRadius = 4
            button.contentEdgeInsets = UIEdgeInsets(top: 4, left: 5, bottom: 4, right: 5)
            button.addTarget(self, action: #selector(toggleTapped(_:)), for: .touchUpInside)
            button.setTitle(toggle.title, for: .normal)
            buttonRow.addArrangedSubview(button)
        }

        let reload = UIButton(type: .system)
        reload.tag = -1
        reload.setTitle("RELOAD", for: .normal)
        reload.titleLabel?.font = .monospacedSystemFont(ofSize: 9, weight: .bold)
        reload.setTitleColor(.white, for: .normal)
        reload.backgroundColor = UIColor.systemIndigo
        reload.layer.cornerRadius = 4
        reload.contentEdgeInsets = UIEdgeInsets(top: 4, left: 5, bottom: 4, right: 5)
        reload.addTarget(self, action: #selector(reloadTapped), for: .touchUpInside)
        buttonRow.addArrangedSubview(reload)

        let stack = UIStackView(arrangedSubviews: [statusLabel, logLabel, buttonRow])
        stack.axis = .vertical
        stack.alignment = .leading
        stack.spacing = 5
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: topAnchor, constant: 8),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -8),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 10),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -10),
            buttonRow.widthAnchor.constraint(equalTo: stack.widthAnchor)
        ])

        NotificationCenter.default.addObserver(self,
                                               selector: #selector(refresh),
                                               name: DebugLog.didChange,
                                               object: nil)

        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.refresh()
        }
    }

    /// The overlay floats over the page, so only the buttons may take a touch —
    /// anything else here would quietly swallow taps on the page underneath.
    override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
        buttonRow.point(inside: convert(point, to: buttonRow), with: event)
    }

    @objc func refresh() {
        DispatchQueue.main.async {
            let audio = AudioSessionManager.shared
            self.statusLabel.text = audio.statusDescription
            self.statusLabel.textColor = audio.isCaptureActive ? .systemGreen : UIColor.white.withAlphaComponent(0.7)
            self.logLabel.text = DebugLog.shared.recent.joined(separator: "\n")

            for case let button as UIButton in self.buttonRow.arrangedSubviews where button.tag >= 0 {
                let isOn = self.toggles[button.tag].isOn()
                button.setTitleColor(isOn ? .black : UIColor.white.withAlphaComponent(0.6), for: .normal)
                button.backgroundColor = isOn ? .systemGreen : UIColor.white.withAlphaComponent(0.12)
            }
        }
    }

    @objc private func toggleTapped(_ sender: UIButton) {
        let toggle = toggles[sender.tag]
        let newValue = !toggle.isOn()
        toggle.set(newValue)
        DebugLog.shared.log("\(toggle.title) -> \(newValue ? "on" : "off")")
        refresh()

        // The page scripts are injected at document start, so those two only take
        // effect on the next load.
        if toggle.reloadsPage { onReload?() }
    }

    @objc private func reloadTapped() {
        onReload?()
    }
}
