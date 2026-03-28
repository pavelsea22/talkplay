<script lang="ts">
  import { onMount } from 'svelte';
  import { speakWord, blobToWav } from '../../client/activity/audio';
  import SpeechBubble from '../../client/activity/SpeechBubble.svelte';
  import { evaluateDrillWord } from './evaluator';
  import { getWeakestPhonemeHint } from './phonemeFeedback';
  import type { DrillWordTask } from './index';
  import type { TaskOutcome, PhonemeAssessment } from '../shared/types';

  const RECORD_SECONDS = 3;
  const POST_PROMPT_DELAY_MS = 50;  // delay after voice prompt before mic opens
  const ERROR_DISPLAY_MS = 2000;    // how long an incorrect-answer message stays on screen
  const MAX_RETRIES = 3;

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
  let cindyMood = $state('neutral');
  let feedbackWord = $state<string | null>(null);
  let feedbackText = $state('');
  let feedbackClass = $state('');
  let showIllustration = $state(true);
  let retryCount = $state(0);
  let phonemeHint = $state<string | null>(null);

  // Set the word prompt before first render. showPrompt() is a function
  // declaration (hoisted), so calling it here is safe even though the
  // definition appears later in the file.
  showPrompt();

  // --- Recording internals ---
  let mediaRecorder: MediaRecorder | null = $state(null);
  let chunks: Blob[] = $state([]);
  let timerInterval: ReturnType<typeof setInterval> | null = $state(null);

  /** Resets the UI back to the word prompt and clears any phoneme hint. */
  function showPrompt(): void {
    feedbackWord = task.word;
    feedbackText = '';
    feedbackClass = '';
    showIllustration = true;
    cindyMood = 'neutral';
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
   * Speaks the word prompt, waits POST_PROMPT_DELAY_MS, then opens the mic
   * and hands off to startRecording. Called by both auto-start and manual paths.
   */
  async function runSession(): Promise<void> {
    try {
      await speakWord(task.word);
    } catch (err) {
      console.error('TTS failed:', err);
    }
    await new Promise(r => setTimeout(r, POST_PROMPT_DELAY_MS));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startRecording(stream);
    } catch (err) {
      status = 'Microphone access denied.';
      micDisabled = false;
      console.error(err);
    }
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
        showIllustration = false;
        feedbackWord = null;
        feedbackText = result.screenMessage;
        feedbackClass = result.screenClass;
        status = '';
        cindyMood = result.cindyMood;

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
        feedbackWord = null;
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

<SpeechBubble
  {cindyMood}
  illustration={task.illustration}
  {showIllustration}
  {feedbackWord}
  {feedbackText}
  {feedbackClass}
/>

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
  <button
    class="next-btn {!showNext ? 'hidden' : ''}"
    onclick={() => onComplete('passed')}
  >
    Next →
  </button>
</div>

<div class="countdown {countdownValue === null ? 'hidden' : ''}">
  {countdownValue ?? ''}
</div>
<div class="status">{status}</div>

<style>
  .btn-container {
    position: relative;
    width: 120px;
    height: 120px;
  }

  .mic-btn, .next-btn {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
    cursor: pointer;
    font-family: 'Baloo 2', system-ui, sans-serif;
    font-weight: 700;
    color: #fff;
    transition: background 0.2s, transform 0.1s;
  }

  .mic-btn {
    border-radius: 50%;
    background: #2563eb;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 24px rgba(37, 99, 235, 0.4);
  }

  .mic-btn:hover  { background: #1d4ed8; }
  .mic-btn:active { transform: scale(0.96); }

  .mic-btn.recording {
    background: #dc2626;
    box-shadow: 0 4px 24px rgba(220, 38, 38, 0.5);
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 4px 24px rgba(220, 38, 38, 0.5); }
    50%       { box-shadow: 0 4px 40px rgba(220, 38, 38, 0.85); }
  }

  .mic-btn :global(svg) { width: 48px; height: 48px; pointer-events: none; }
  .mic-btn.hidden  { display: none; }

  .next-btn {
    border-radius: 16px;
    background: #2563eb;
    font-size: 1.1rem;
    box-shadow: 0 4px 24px rgba(37, 99, 235, 0.4);
  }
  .next-btn:hover  { background: #1d4ed8; }
  .next-btn:active { transform: scale(0.96); }
  .next-btn.hidden { display: none; }

  .status {
    margin-top: 1.8rem;
    font-size: 1.4rem;
    color: #9ca3af;
    min-height: 1.4em;
    text-align: center;
  }

  .countdown {
    font-size: 3rem;
    font-weight: 700;
    color: #dc2626;
    min-height: 4rem;
    margin-top: 0.5rem;
    transition: opacity 0.3s;
  }

  .countdown.hidden { opacity: 0; }

  .phoneme-hint {
    margin: 0.5rem auto 0;
    max-width: 320px;
    text-align: center;
    font-size: 1.05rem;
    font-weight: 600;
    color: #7c3aed;
    line-height: 1.4;
  }
</style>
