import LiveKit

/// The ReplayKit broadcast extension behind the screen share button.
///
/// iOS runs this in its own process when the user taps Start Broadcast. LiveKit's
/// handler forwards the frames to the Commz app through the shared App Group,
/// and the app publishes them from its screen-share room connection (see
/// `ScreenShareBridge`). Broadcast extensions get very little memory, which is
/// why the encoding and publishing happen in the app, not here.
class SampleHandler: LKSampleHandler {
    override var enableLogging: Bool { true }
}
