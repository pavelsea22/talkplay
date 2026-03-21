// Currently playing TTS element — stopped when a new one starts.
let currentAudio: HTMLAudioElement | null = null;

/**
 * Stops any currently playing TTS audio immediately.
 */
export function stopCurrentTts(): void {
  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.pause();
    URL.revokeObjectURL(currentAudio.src);
    currentAudio = null;
  }
}

/**
 * Plays a word or phrase via Azure TTS and resolves when playback ends.
 *
 * - `raw: true` sends the text as-is to the server (no "Say " prefix).
 * - Default: the server prepends "Say " before synthesizing.
 *
 * Any currently playing TTS is stopped before the new one starts.
 * Callers that need to wait for playback to finish should `await` this function.
 */
export async function speakWord(word: string, options: { raw?: boolean } = {}): Promise<void> {
  try {
    const rawParam = options.raw ? "&raw=1" : "";
    const res = await fetch(`/speak?word=${encodeURIComponent(word)}${rawParam}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    stopCurrentTts();

    const audio = new Audio(url);
    currentAudio = audio;

    return new Promise<void>(resolve => {
      audio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); currentAudio = null; resolve(); };
      audio.play();
    });
  } catch (err) {
    console.error("TTS failed:", err);
  }
}

/**
 * Converts a raw audio Blob (e.g. WebM/Opus from MediaRecorder) into a
 * 16 kHz mono PCM WAV ArrayBuffer suitable for the Azure Speech SDK.
 * Uses the Web Audio API to decode and resample the audio.
 */
export async function blobToWav(blob: Blob): Promise<ArrayBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);
  await audioCtx.close();

  const targetRate = 16000;
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(decoded.duration * targetRate), targetRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(offlineCtx.destination);
  source.start();
  const resampled = await offlineCtx.startRendering();
  return encodeWav(resampled.getChannelData(0), targetRate);
}

/**
 * Encodes a Float32Array of mono PCM samples into a WAV ArrayBuffer.
 * Produces a standard 44-byte RIFF/WAVE header followed by 16-bit PCM data.
 *
 * @param samples - Normalised audio samples in the range [-1, 1].
 * @param sampleRate - Sample rate in Hz (e.g. 16000).
 */
export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const buf = new ArrayBuffer(44 + pcm.byteLength);
  const view = new DataView(buf);
  const w = (off: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
  w(0, "RIFF"); view.setUint32(4, 36 + pcm.byteLength, true);
  w(8, "WAVE"); w(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  w(36, "data"); view.setUint32(40, pcm.byteLength, true);
  new Int16Array(buf, 44).set(pcm);
  return buf;
}
