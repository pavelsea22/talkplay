<script lang="ts">
  import { evaluateTask } from '../../tasks';
  import type { Task, TaskStatus } from '../../tasks';
  import { pickLesson } from '../../words';
  import { speakWord, blobToWav } from './audio';
  import SpeechBubble from './SpeechBubble.svelte';
  import LessonProgress from './LessonProgress.svelte';
  import PopTheBalloon from '../minigames/PopTheBalloon.svelte';

  const RECORD_SECONDS = 3;   // how long the mic stays open
  const PRE_ROLL_MS = 1000;   // "Get ready…" pause before recording starts
  const ERROR_DISPLAY_MS = 2000; // how long an incorrect-answer message stays on screen
  const LESSON_SIZE = 5;      // words per lesson
  const MAX_RETRIES = 3;      // wrong attempts before a word is marked failed and skipped

  // Keep _initialEntries as a plain array so Svelte doesn't warn about
  // capturing a reactive value for the feedbackWord initial state below.
  const _initialEntries = pickLesson(LESSON_SIZE);
  let lessonEntries = $state<Task[]>(_initialEntries);
  let lessonStatuses = $state<TaskStatus[]>(Array.from({ length: LESSON_SIZE }, () => 'pending'));
  let lessonIndex = $state(0);
  let lessonComplete = $state(false);
  let showMinigame = $state(false); // whether the balloon minigame card is visible

  let currentEntry = $derived(lessonEntries[lessonIndex]);

  // UI state
  let status = $state('Press the mic to record');
  let countdownValue: number | null = $state(null);
  let isRecording = $state(false);
  let showNext = $state(false);      // show "Next →" button after a correct answer
  let micDisabled = $state(false);
  let cindyMood = $state('neutral');
  let feedbackWord = $state<string | null>(_initialEntries[0].word);
  let feedbackText = $state('');
  let feedbackClass = $state('');
  let showIllustration = $state(true);
  let wordSpoken = $state(false);    // whether TTS has already been played for this word
  let retryCount = $state(0);

  // Recording internals
  let mediaRecorder: MediaRecorder | null = $state(null);
  let chunks: Blob[] = $state([]);
  let timerInterval: ReturnType<typeof setInterval> | null = $state(null);

  /** Updates the UI to show the word prompt for the current entry. */
  function showPrompt(): void {
    feedbackWord = currentEntry.word;
    feedbackText = '';
    feedbackClass = '';
    showIllustration = true;
    cindyMood = 'neutral';
  }

  /** Advances to the next word, or marks the lesson complete. */
  function advanceWord(): void {
    const nextIndex = lessonIndex + 1;
    if (nextIndex >= LESSON_SIZE) {
      lessonComplete = true;
      showMinigame = true;
      return;
    }
    lessonIndex = nextIndex;
    showPrompt();
    showNext = false;
    micDisabled = false;
    status = 'Press the mic to record';
    retryCount = 0;
    wordSpoken = false;
    speakWord(currentEntry.word).catch(err => console.error('TTS failed:', err));
    wordSpoken = true;
  }

  function handleNextClick(): void {
    advanceWord();
  }

  /** Resets all lesson state and picks a fresh set of tasks. */
  function handlePlayAgain(): void {
    lessonEntries = pickLesson(LESSON_SIZE);
    lessonStatuses = Array.from({ length: LESSON_SIZE }, () => 'pending' as TaskStatus);
    lessonIndex = 0;
    lessonComplete = false;
    status = 'Press the mic to record';
    showNext = false;
    micDisabled = false;
    retryCount = 0;
    wordSpoken = false;
    cindyMood = 'neutral';
    feedbackText = '';
    feedbackClass = '';
    showIllustration = true;
  }

  async function handleMicClick(): Promise<void> {
    if (mediaRecorder?.state === 'recording') return;
    micDisabled = true;
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
   * Starts a recording session from the given MediaStream.
   * Sequence:
   * 1. Shows a {@link PRE_ROLL_MS} "Get ready…" pre-roll (speaks the word on first attempt).
   * 2. Records for {@link RECORD_SECONDS} seconds with a live countdown.
   * 3. On stop: converts audio to WAV, sends to /transcribe, evaluates the result,
   *    updates the UI and speaks the feedback.
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
        form.append('words', JSON.stringify([currentEntry.word]));
        const res = await fetch('/transcribe', { method: 'POST', body: form });
        if (!res.ok) throw new Error(`Transcription request failed: ${res.status}`);
        const { transcript } = await res.json() as { transcript: string };

        const outcome = evaluateTask(currentEntry, transcript, retryCount);
        showIllustration = false;
        feedbackWord = null;
        feedbackText = outcome.screenMessage;
        feedbackClass = outcome.screenClass;
        status = '';
        cindyMood = outcome.cindyMood;

        if (outcome.outcome === 'passed') {
          retryCount = 0;
          lessonStatuses = lessonStatuses.map((s, i) => i === lessonIndex ? 'passed' : s);
          showNext = true;
          micDisabled = true;
          speakWord(outcome.spoken!, { raw: true }).catch(err => console.error('TTS failed:', err));
        } else {
          retryCount++;
          await Promise.all([
            speakWord(outcome.spoken!, { raw: true }).catch(err => console.error('TTS failed:', err)),
            new Promise(r => setTimeout(r, ERROR_DISPLAY_MS)),
          ]);

          if (retryCount >= MAX_RETRIES) {
            lessonStatuses = lessonStatuses.map((s, i) => i === lessonIndex ? 'failed' : s);
            advanceWord();
          } else {
            showPrompt();
            status = 'Press the mic to record';
            micDisabled = false;
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

    status = 'Get ready…';
    if (!wordSpoken) {
      speakWord(currentEntry.word).catch(err => console.error('TTS failed:', err));
      wordSpoken = true;
    }
    await new Promise(r => setTimeout(r, PRE_ROLL_MS));

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
</script>

<div class="progress-container">
  <LessonProgress statuses={lessonStatuses} currentIndex={lessonIndex} />
</div>

<a href="/" class="back-btn">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
  Lessons
</a>
<h1>TalkPlay</h1>

{#if lessonComplete}
  <div class="complete">
    <p class="complete-title">Great job! 🎉</p>
    <p class="complete-sub">You finished the lesson!</p>
    <button class="play-again-btn" onclick={handlePlayAgain}>Play Again</button>
  </div>
{:else}
  <SpeechBubble
    {cindyMood}
    illustration={currentEntry.illustration}
    {showIllustration}
    {feedbackWord}
    {feedbackText}
    {feedbackClass}
  />

  <div class="btn-container">
    <button
      class="mic-btn {isRecording ? 'recording' : ''} {showNext ? 'hidden' : ''}"
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
      onclick={handleNextClick}
    >
      Next →
    </button>
  </div>

  <div class="countdown {countdownValue === null ? 'hidden' : ''}">
    {countdownValue ?? ''}
  </div>
  <div class="status">{status}</div>
{/if}

{#if showMinigame}
  <!-- Minigame overlay: shown after lesson completion -->
  <div class="minigame-overlay">
    <div class="minigame-card">
      <h2 class="minigame-title">Pop the Balloons!</h2>
      <PopTheBalloon onClose={() => showMinigame = false} />
    </div>
  </div>
{/if}

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }

  :global(body) {
    min-height: 100vh;
    background: #0f0f13;
    color: #f0f0f0;
    font-family: 'Baloo 2', system-ui, sans-serif;
  }

  :global(#app) {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  h1 {
    position: fixed;
    top: 1.2rem;
    right: 1.5rem;
    font-size: 1.6rem;
    font-weight: 800;
    color: #fff;
    margin: 0;
  }

  .back-btn {
    position: fixed;
    top: 1.1rem;
    left: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: 'Baloo 2', system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #9ca3af;
    text-decoration: none;
    transition: color 0.2s;
  }

  .back-btn:hover { color: #f0f0f0; }

  .progress-container {
    position: fixed;
    top: 1.1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
  }

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

  .mic-btn:hover { background: #1d4ed8; }
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
  .mic-btn.hidden { display: none; }

  .next-btn {
    border-radius: 16px;
    background: #2563eb;
    font-size: 1.1rem;
    box-shadow: 0 4px 24px rgba(37, 99, 235, 0.4);
  }
  .next-btn:hover { background: #1d4ed8; }
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

  .complete {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
  }

  .complete-title {
    font-size: 2.5rem;
    font-weight: 800;
  }

  .complete-sub {
    font-size: 1.3rem;
    color: #9ca3af;
  }

  .play-again-btn {
    margin-top: 0.5rem;
    padding: 0.8rem 2rem;
    border: none;
    border-radius: 16px;
    background: #2563eb;
    color: #fff;
    font-family: 'Baloo 2', system-ui, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 24px rgba(37, 99, 235, 0.4);
    transition: background 0.2s, transform 0.1s;
  }

  .play-again-btn:hover { background: #1d4ed8; }
  .play-again-btn:active { transform: scale(0.96); }

  .minigame-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
  }

  .minigame-card {
    background: #1e293b;
    border-radius: 20px;
    padding: 1.2rem;
    width: 320px;
    height: 520px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  }

  .minigame-title {
    text-align: center;
    font-size: 1.3rem;
    font-weight: 800;
    color: #f0f0f0;
    margin-bottom: 0.4rem;
  }
</style>
