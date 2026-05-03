<script lang="ts">
  import { onMount } from 'svelte';
  import { speakWord, blobToWav } from '../../client/activity/audio';
  import { evaluateDrillWord } from './evaluator';
  import { getWeakestPhonemeHint } from './phonemeFeedback';
  import { MAX_RETRIES } from '../constants';
  import type { DrillWordTask } from './index';
  import type { TaskOutcome, PhonemeAssessment } from '../shared/types';
  import NextButton from '../../client/activity/NextButton.svelte';

  const RECORD_SECONDS = 3;
  const POST_PROMPT_DELAY_MS = 50;  // delay after voice prompt before mic opens
  const ERROR_DISPLAY_MS = 2000;    // how long an incorrect-answer message stays on screen

  interface Props {
    task: DrillWordTask;
    /** Called once, when the task is definitively passed or failed. */
    onComplete: (outcome: TaskOutcome) => void;
  }

  let { task, onComplete }: Props = $props();

  // --- UI state ---
  let status = $state('');
  let countdownValue: number | null = $state(null);
  let isRecording = $state(false);
  let showNext = $state(false);
  let micDisabled = $state(false);
  let feedbackText = $state('');
  let feedbackClass = $state('');
  let showPromptCard = $state(true);
  let retryCount = $state(0);
  let phonemeHint = $state<string | null>(null);

  // Set the word prompt before first render.
  showPrompt();

  // --- Recording internals ---
  let mediaRecorder: MediaRecorder | null = $state(null);
  let chunks: Blob[] = $state([]);
  let timerInterval: ReturnType<typeof setInterval> | null = $state(null);

  /** Resets the UI back to the word prompt and clears any phoneme hint. */
  function showPrompt(): void {
    feedbackText = '';
    feedbackClass = '';
    showPromptCard = true;
    phonemeHint = null;
  }

  /**
   * Returns true if the user has already granted microphone permission.
   * Falls back to false when the Permissions API is unavailable.
   */
  async function isMicPermitted(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Opens the mic first so the hardware warms up, then speaks the word prompt
   * and hands off to startRecording. Requesting the stream before TTS means the
   * OS microphone is fully active by the time recording starts.
   */
  async function runSession(): Promise<void> {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      status = 'Microphone access denied.';
      micDisabled = false;
      console.error(err);
      return;
    }
    try {
      await speakWord(task.word);
    } catch (err) {
      console.error('TTS failed:', err);
    }
    await new Promise(r => setTimeout(r, POST_PROMPT_DELAY_MS));
    startRecording(stream);
  }

  /**
   * Attempts to auto-start a recording session. If microphone permission has not
   * been granted yet, reveals the mic button for the user to tap instead.
   * Invoked on mount and after each failed attempt.
   */
  async function beginRecordingSession(): Promise<void> {
    if (mediaRecorder?.state === 'recording') return;
    micDisabled = true;
    if (!await isMicPermitted()) {
      status = 'Tap the mic to start';
      micDisabled = false;
      return;
    }
    await runSession();
  }

  /**
   * Handles manual mic button taps. Always calls getUserMedia directly —
   * the browser will prompt for permission if it hasn't been granted yet.
   */
  async function handleMicClick(): Promise<void> {
    if (mediaRecorder?.state === 'recording') return;
    micDisabled = true;
    await runSession();
  }

  /**
   * Full recording sequence:
   * 1. Records for RECORD_SECONDS with a live countdown.
   * 2. On stop: transcribes audio, evaluates, updates UI, calls onComplete if finished.
   *
   * Callers are responsible for speaking the word prompt and waiting
   * POST_PROMPT_DELAY_MS before invoking this function.
   */
  async function startRecording(stream: MediaStream): Promise<void> {
    chunks = [];
    micDisabled = true;

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream);
    } catch (err) {
      stream.getTracks().forEach(t => t.stop());
      status = 'Recording is not supported on this device.';
      micDisabled = false;
      console.error(err);
      return;
    }

    const mimeType = recorder.mimeType;
    mediaRecorder = recorder;

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
      countdownValue = null;
      isRecording = false;

      const blob = new Blob(chunks, { type: mimeType });
      try {
        const wavBuffer = await blobToWav(blob);
        const form = new FormData();
        form.append('audio', new Blob([wavBuffer], { type: 'audio/wav' }), 'audio.wav');
        form.append('words', JSON.stringify([task.word]));
        form.append('word', task.word);
        const res = await fetch('/transcribe', { method: 'POST', body: form });
        if (!res.ok) throw new Error(`Transcription failed: ${res.status}`);
        const { transcript, assessment } = await res.json() as {
          transcript: string;
          assessment: PhonemeAssessment | null;
        };

        const result = evaluateDrillWord(task, transcript, assessment, retryCount);
        showPromptCard = false;
        feedbackText = result.screenMessage;
        feedbackClass = result.screenClass;
        status = '';

        if (result.outcome === 'passed') {
          phonemeHint = null;
          retryCount = 0;
          showNext = true;
          micDisabled = true;
          speakWord(result.spoken!, { raw: true }).catch(err => console.error('TTS failed:', err));
        } else {
          retryCount++;
          const hint = assessment ? getWeakestPhonemeHint(assessment) : null;
          phonemeHint = hint;
          const speakRetry = speakWord(result.spoken!, { raw: true })
            .catch(err => console.error('TTS failed:', err));
          if (hint) {
            speakRetry.then(() =>
              speakWord(hint, { raw: true }).catch(err => console.error('TTS hint failed:', err))
            );
          }
          await Promise.all([
            speakRetry,
            new Promise(r => setTimeout(r, ERROR_DISPLAY_MS)),
          ]);

          if (retryCount >= MAX_RETRIES) {
            onComplete('failed');
          } else {
            showPrompt();
            beginRecordingSession();
          }
        }
      } catch (err) {
        feedbackText = '(transcription error)';
        console.error(err);
        micDisabled = false;
      }
    };

    recorder.start();

    isRecording = true;
    let remaining = RECORD_SECONDS;
    countdownValue = remaining;
    status = 'Speak now!';

    timerInterval = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        countdownValue = remaining;
      } else {
        clearInterval(timerInterval!);
        timerInterval = null;
        countdownValue = null;
        if (mediaRecorder) mediaRecorder.stop();
        isRecording = false;
        status = 'Processing…';
      }
    }, 1000);
  }

  // Speak the word prompt and automatically begin recording on mount.
  onMount(() => {
    beginRecordingSession();
  });
</script>

{#if showPromptCard}
  <div class="word-card">
    <img
      class="word-illustration"
      src="/{task.illustration}"
      alt={task.word}
      onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
    />
    <p class="word-prompt">Say <strong>{task.word}</strong></p>
  </div>
{:else}
  <div class="feedback-area">
    <p class="feedback-text {feedbackClass}">{feedbackText}</p>
  </div>
{/if}

{#if phonemeHint}
  <p class="phoneme-hint">{phonemeHint}</p>
{/if}

<div class="btn-container">
  <button
    class="mic-btn {isRecording ? 'recording' : ''} {showNext || (!isRecording && micDisabled) ? 'hidden' : ''}"
    aria-label="Start recording"
    disabled={micDisabled}
    onclick={handleMicClick}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3"/>
      <path d="M5 10a7 7 0 0 0 14 0"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="8"  y1="22" x2="16" y2="22"/>
    </svg>
  </button>
  {#if showNext}
    <div class="next-btn-overlay">
      <NextButton onclick={() => onComplete('passed')} />
    </div>
  {/if}
</div>

<div class="countdown {countdownValue === null ? 'hidden' : ''}">
  {countdownValue ?? ''}
</div>
<div class="status">{status}</div>

<style>
  .word-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-8) var(--space-10);
    background: var(--color-surface-container-lowest);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-ambient);
    outline: 1px solid rgba(141, 177, 209, 0.15);
    margin-bottom: var(--space-6);
  }

  .word-illustration {
    width: 96px;
    height: 96px;
    object-fit: contain;
  }

  .word-prompt {
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 1.375rem;
    font-weight: 600;
    color: var(--color-on-surface-variant);
    text-align: center;
  }

  .word-prompt :global(strong) {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--color-primary);
    display: block;
    margin-top: var(--space-1);
  }

  .feedback-area {
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-6);
  }

  .feedback-text {
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 1.125rem;
    font-weight: 600;
    text-align: center;
    color: var(--color-on-surface-variant);
    max-width: 280px;
    line-height: 1.4;
  }

  .feedback-text.correct   { color: var(--color-secondary); font-size: 2rem; }
  .feedback-text.incorrect { color: #b91c1c; }

  .phoneme-hint {
    margin: 0 auto var(--space-4);
    max-width: 320px;
    text-align: center;
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-primary);
    line-height: 1.4;
  }

  .btn-container {
    position: relative;
    width: 120px;
    height: 120px;
  }

  .mic-btn {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
    cursor: pointer;
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-weight: 600;
    color: var(--color-on-primary);
    transition: opacity var(--duration-fast) var(--ease-in-out),
                transform var(--duration-fast) var(--ease-in-out);
  }

  .next-btn-overlay {
    position: absolute;
    inset: 0;
  }

  .next-btn-overlay :global(button) {
    width: 100%;
    height: 100%;
    padding: 0;
  }

  .mic-btn {
    border-radius: var(--radius-full);
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-ambient);
  }

  .mic-btn:hover  { opacity: 0.9; }
  .mic-btn:active { transform: scale(0.95); }

  .mic-btn.recording {
    background: #dc2626;
    box-shadow: 0 4px 24px rgba(220, 38, 38, 0.4);
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 4px 24px rgba(220, 38, 38, 0.4); }
    50%       { box-shadow: 0 4px 40px rgba(220, 38, 38, 0.7); }
  }

  .mic-btn :global(svg) { width: 48px; height: 48px; pointer-events: none; }
  .mic-btn.hidden  { display: none; }

  .status {
    margin-top: var(--space-6);
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-on-surface-variant);
    min-height: 1.4em;
    text-align: center;
  }

  .countdown {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 3rem;
    font-weight: 700;
    color: #dc2626;
    min-height: 4rem;
    margin-top: var(--space-2);
    transition: opacity var(--duration-base);
  }

  .countdown.hidden { opacity: 0; }
</style>
