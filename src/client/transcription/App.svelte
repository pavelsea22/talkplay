<script lang="ts">
  import { blobToWav } from '../activity/audio';

  /** Idle → recording → processing → done/error lifecycle of the page. */
  type State = 'idle' | 'recording' | 'processing';

  let state = $state<State>('idle');
  let transcript = $state<string | null>(null);
  let confidence = $state<number | null>(null);
  let errorMessage = $state<string | null>(null);

  let mediaRecorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: Blob[] = [];

  /** Begins microphone capture. Asks for permission on the first run. */
  async function startRecording(): Promise<void> {
    errorMessage = null;
    transcript = null;
    confidence = null;
    chunks = [];

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error(err);
      errorMessage = 'Could not access the microphone. Please allow mic access and try again.';
      return;
    }

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream);
    } catch (err) {
      console.error(err);
      errorMessage = 'Recording is not supported on this device.';
      stream.getTracks().forEach(t => t.stop());
      stream = null;
      return;
    }

    mediaRecorder = recorder;
    const mimeType = recorder.mimeType || 'audio/webm';
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => { void transcribe(mimeType); };
    recorder.start();
    state = 'recording';
  }

  /** Stops the active recording, which triggers transcription via `onstop`. */
  function stopRecording(): void {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    stream?.getTracks().forEach(t => t.stop());
    stream = null;
    state = 'processing';
  }

  /**
   * Converts the recorded audio to WAV, sends it to the `/transcribe` endpoint
   * with no reference word (free-form recognition) and shows the result.
   *
   * @param mimeType - MIME type of the recorded blob, used to wrap the chunks.
   */
  async function transcribe(mimeType: string): Promise<void> {
    try {
      const blob = new Blob(chunks, { type: mimeType });
      const wavBuffer = await blobToWav(blob);
      const form = new FormData();
      form.append('audio', new Blob([wavBuffer], { type: 'audio/wav' }), 'audio.wav');
      // No `words` or `word` fields: free-form recognition, no phrase biasing.

      const res = await fetch('/transcribe', { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Transcription failed: ${res.status}`);
      const result = await res.json() as {
        transcript: string;
        confidence: number | null;
      };

      transcript = result.transcript;
      confidence = result.confidence;
    } catch (err) {
      console.error(err);
      errorMessage = 'Something went wrong while transcribing. Please try again.';
    } finally {
      state = 'idle';
    }
  }

  /** Toggles recording on/off from the single mic button. */
  function handleMicClick(): void {
    if (state === 'idle') startRecording();
    else if (state === 'recording') stopRecording();
  }
</script>

<a href="/parent" class="back-btn">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
  Parent Portal
</a>

<header class="hero">
  <p class="welcome">Speech Check</p>
  <h1 class="title">Say anything into the mic</h1>
  <p class="subtitle">We'll show you exactly what Azure heard.</p>
</header>

<section class="panel">
  <button
    type="button"
    class="mic-btn"
    class:recording={state === 'recording'}
    disabled={state === 'processing'}
    onclick={handleMicClick}
    aria-label={state === 'recording' ? 'Stop recording' : 'Start recording'}
  >
    {#if state === 'processing'}
      <svg class="spinner" width="40" height="40" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    {:else}
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    {/if}
  </button>

  <p class="status">
    {#if state === 'recording'}
      Listening… tap to stop
    {:else if state === 'processing'}
      Transcribing…
    {:else}
      Tap the mic to start
    {/if}
  </p>
</section>

{#if errorMessage}
  <section class="panel result error">
    <p>{errorMessage}</p>
  </section>
{:else if transcript !== null}
  <section class="panel result">
    <h2 class="section-title">Transcription</h2>
    {#if transcript.trim()}
      <p class="transcript">{transcript}</p>
    {:else}
      <p class="transcript empty">No speech was detected. Try again a little louder.</p>
    {/if}
    {#if confidence !== null}
      <p class="confidence">Confidence: {Math.round(confidence * 100)}%</p>
    {/if}
  </section>
{/if}

<style>
  /* Tokens (colors, spacing, radii, motion) are in src/client/tokens.css,
     imported by main.ts. Only page-specific layout lives here. */

  :global(body) {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-12) var(--space-4) var(--space-8);
  }

  .back-btn {
    position: fixed;
    top: var(--space-6);
    left: var(--space-6);
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-full);
    background: var(--color-surface-container);
    color: var(--color-on-surface-variant);
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    transition: background var(--duration-base) var(--ease-in-out);
  }
  .back-btn:hover {
    background: var(--color-surface-container-high);
    color: var(--color-on-surface);
  }

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-10);
  }
  .welcome {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-on-surface-variant);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .title {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    text-align: center;
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .subtitle {
    font-size: 1rem;
    color: var(--color-on-surface-variant);
    text-align: center;
  }

  .panel {
    width: 100%;
    max-width: 32rem;
    padding: var(--space-6);
    margin-bottom: var(--space-6);
    background: var(--color-surface-container-lowest);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-ambient);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
  }

  .mic-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 6rem;
    height: 6rem;
    border: none;
    border-radius: var(--radius-full);
    background: var(--color-primary);
    color: white;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-in-out);
    box-shadow: var(--shadow-ambient);
  }
  .mic-btn:hover:not(:disabled) {
    transform: scale(1.05);
  }
  .mic-btn:disabled {
    opacity: 0.7;
    cursor: progress;
  }
  .mic-btn.recording {
    background: var(--color-error, #d32f2f);
    animation: pulse 1.2s var(--ease-in-out) infinite;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.4); }
    50% { box-shadow: 0 0 0 16px rgba(211, 47, 47, 0); }
  }

  .spinner {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .status {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-on-surface-variant);
  }

  .result {
    align-items: stretch;
    text-align: left;
  }
  .section-title {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.125rem;
    font-weight: 700;
  }
  .transcript {
    font-size: 1.25rem;
    line-height: 1.5;
    color: var(--color-on-surface);
  }
  .transcript.empty {
    font-size: 1rem;
    color: var(--color-on-surface-variant);
    font-style: italic;
  }
  .confidence {
    font-size: 0.875rem;
    color: var(--color-on-surface-variant);
  }
  .result.error {
    color: var(--color-error, #d32f2f);
  }
</style>
