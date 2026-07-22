import Foundation
import CoreVideo

/// Кадр: буфер пикселей + монотонная метка времени.
struct Frame {
    let buffer: CVPixelBuffer
    let timestamp: TimeInterval
}

/// SEAM. Единственное место в проекте, знающее про AVFoundation.
/// КРИТИЧНО для iOS: в Simulator камеры нет вообще, поэтому без этого seam
/// SEduM невозможно покрыть автотестами.
protocol FrameSource {
    var frames: AsyncStream<Frame> { get }
    func stop()
}

// --- ПРОД ---
// final class LiveCameraSource: FrameSource { /* AVCaptureVideoDataOutput */ }

// --- ТЕСТЫ ---
// final class FileFrameSource: FrameSource { /* AVAssetReader + виртуальные часы */ }

/// Выбор источника по launch-аргументу:
///   XCUIApplication().launchArguments = ["-FrameSource", "fixture:looking_away"]
///
/// enum FrameSourceFactory {
///     static func make() -> FrameSource {
///         let arg = UserDefaults.standard.string(forKey: "FrameSource") ?? ""
///         if arg.hasPrefix("fixture:") {
///             return FileFrameSource(named: String(arg.dropFirst("fixture:".count)))
///         }
///         return LiveCameraSource()
///     }
/// }
