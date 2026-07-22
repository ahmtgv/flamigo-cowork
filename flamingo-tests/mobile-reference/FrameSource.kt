package com.flamingo.sedum.source

import kotlinx.coroutines.flow.Flow

/** Кадр: буфер пикселей + монотонная метка времени. */
data class Frame(val pixels: ByteArray, val width: Int, val height: Int, val timestampNanos: Long)

/**
 * SEAM. Единственное место в проекте, знающее про androidx.camera.
 * Выше по стеку (VisionPipeline, UI) камера не импортируется никогда.
 */
interface FrameSource {
    fun frames(): Flow<Frame>
    fun stop()
}

// --- ПРОД ---
// class LiveCameraSource(...) : FrameSource   // androidx.camera / CameraX

// --- ТЕСТЫ: чтение кадров из фикстурного видео по виртуальным часам ---
// class FileFrameSource(assetName: String, private val clock: VirtualClock) : FrameSource

/**
 * Выбор источника по launch-аргументу:
 *   adb shell am instrument -e frame_source fixture_looking_away ...
 *
 * object FrameSourceFactory {
 *     fun create(args: Bundle?): FrameSource {
 *         val fixture = args?.getString("frame_source")
 *         return if (fixture != null) FileFrameSource("fixtures/$fixture.mp4", VirtualClock())
 *                else LiveCameraSource()
 *     }
 * }
 */
