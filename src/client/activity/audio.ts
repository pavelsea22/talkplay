// Currently playing TTS element — stopped when a new one starts.
let currentAudio: HTMLAudioElement | null = null;

/**
 * Classifies a TTS playback failure so callers can decide how to respond.
 *
 * - `'autoplay'`: browser blocked playback because no user gesture has occurred
 *   yet (DOMException with name `NotAllowedError`). Recoverable — prompting
 *   the user to tap will allow the next call to play.
 * - `'playback'`: any other failure (network error from `/speak`, broken audio
 *   device, decoder error, etc.). Not automatically recoverable — surface a
 *   user-visible error.
 *
 * @param err - The error caught from a `speakWord` call.
 */
export function classifyAudioError(err: unknown): 'autoplay' | 'playback' {
  return (err as { name?: string } | null | undefined)?.name === 'NotAllowedError'
    ? 'autoplay'
    : 'playback';
}

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
 * Throws if the network request fails or the server returns an error status.
 */
export async function speakWord(word: string, options: { raw?: boolean } = {}): Promise<void> {
  const rawParam = options.raw ? "&raw=1" : "";
  const res = await fetch(`/speak?word=${encodeURIComponent(word)}${rawParam}`);
  if (!res.ok) throw new Error(`TTS request failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  stopCurrentTts();

  const audio = new Audio(url);
  currentAudio = audio;

  return new Promise<void>((resolve, reject) => {
    audio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(url); currentAudio = null; reject(new Error("Audio playback failed")); };
    audio.play().catch(reject);
  });
}

/**
 * Converts a raw audio Blob (e.g. WebM/Opus from MediaRecorder) into a
 * 16 kHz mono PCM WAV ArrayBuffer suitable for the Azure Speech SDK.
 * Uses the Web Audio API to decode and resample the audio.
 */
export async function blobToWav(blob: Blob): Promise<ArrayBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    // Always close the context to release resources, even if decoding fails.
    await audioCtx.close();
  }

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
 *
 * WAV (RIFF/WAVE) header layout — 44 bytes total:
 *  Offset  Size  Field
 *   0       4    "RIFF" chunk ID
 *   4       4    Chunk size = file size − 8
 *   8       4    "WAVE" format
 *  12       4    "fmt " sub-chunk ID
 *  16       4    Sub-chunk size = 16 (for PCM)
 *  20       2    Audio format = 1 (PCM, uncompressed)
 *  22       2    Num channels = 1 (mono)
 *  24       4    Sample rate (e.g. 16000 Hz)
 *  28       4    Byte rate = sampleRate × channels × bytesPerSample
 *  32       2    Block align = channels × bytesPerSample
 *  34       2    Bits per sample = 16
 *  36       4    "data" sub-chunk ID
 *  40       4    Data size = numSamples × channels × bytesPerSample
 *  44       …    Raw 16-bit little-endian PCM samples
 *
 * @param samples    - Normalised audio samples in the range [-1, 1].
 * @param sampleRate - Sample rate in Hz (e.g. 16000).
 */
export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  // Convert float samples to 16-bit signed integers.
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const buf = new ArrayBuffer(44 + pcm.byteLength);
  const view = new DataView(buf);

  // Helper: write an ASCII string into the buffer at the given offset.
  const writeStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF"); view.setUint32(4, 36 + pcm.byteLength, true);
  writeStr(8, "WAVE"); writeStr(12, "fmt ");
  view.setUint32(16, 16, true);          // sub-chunk size
  view.setUint16(20, 1, true);           // PCM format
  view.setUint16(22, 1, true);           // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate (16-bit mono)
  view.setUint16(32, 2, true);           // block align
  view.setUint16(34, 16, true);          // bits per sample
  writeStr(36, "data"); view.setUint32(40, pcm.byteLength, true);
  new Int16Array(buf, 44).set(pcm);

  return buf;
}
