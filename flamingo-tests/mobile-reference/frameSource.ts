/** Вариант для React Native. */

export interface Frame {
  data: Uint8Array;
  width: number;
  height: number;
  timestamp: number;   // монотонные мс
}

/** SEAM: единственный модуль, знающий про react-native-vision-camera. */
export interface FrameSource {
  frames(): AsyncIterable<Frame>;
  stop(): void;
}

// --- ПРОД ---
// export class LiveCameraSource implements FrameSource { /* vision-camera frameProcessor */ }

// --- ТЕСТЫ: декодирование фикстуры по виртуальным часам ---
// export class FileFrameSource implements FrameSource {
//   constructor(private fixture: string, private clock: VirtualClock) {}
// }

export function createFrameSource(): FrameSource {
  // Значение прокидывается launch-аргументом / переменной окружения сборки
  const fixture = process.env.FLAMINGO_FRAME_SOURCE;
  if (fixture) {
    throw new Error(`подставьте FileFrameSource('${fixture}')`);
  }
  throw new Error('подставьте LiveCameraSource()');
}
