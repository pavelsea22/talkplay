<script lang="ts">
  import { processAnswer } from '../../evaluate';
  import { pickWord } from '../../words';
  import { speakWord, blobToWav } from './audio';
  import SpeechBubble from './SpeechBubble.svelte';

  const RECORD_SECONDS = 3;
  const ERROR_DISPLAY_MS = 2000;

  const initialEntry = pickWord();
  let currentEntry = $state(initialEntry);
  let status = $state('Press the mic to record');
  let countdownValue: number | null = $state(null);
  let isRecording = $state(false);
  let showNext = $state(false);
  let micDisabled = $state(false);
  let cindyMood = $state('neutral');
  let feedbackHtml = $state(`Say <strong>${initialEntry.word}</strong>`);
  let feedbackClass = $state('');
  let showIllustration = $state(true);
  let wordSpoken = $state(false);
  let retryCount = $state(0);
  let mediaRecorder: MediaRecorder | null = $state(null);
  let chunks: Blob[] = $state([]);
  let timerInterval: ReturnType<typeof setInterval> | null = $state(null);

  /** Updates the UI to show the word prompt for a given entry. */
  function showPrompt(): void {
    feedbackHtml = `Say <strong>${currentEntry.word}</strong>`;
    feedbackClass = '';
    showIllustration = true;
    cindyMood = 'neutral';
  }

  async function handleMicClick(): Promise<void> {
    if (mediaRecorder && mediaRecorder.state === "recording") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startRecording(stream);
    } catch (err) {
      status = "Microphone access denied.";
      console.error(err);
    }
  }

  function handleNextClick(): void {
    currentEntry = pickWord();
    showPrompt();
    showNext = false;
    micDisabled = false;
    status = "Press the mic to record";
    retryCount = 0;
    wordSpoken = false;
    speakWord(currentEntry.word);
    wordSpoken = true;
  }

  /**
   * Starts a recording session from the given MediaStream.
   * Sequence:
   * 1. Shows a 1-second "Get ready…" pre-roll (speaks the word prompt on first attempt).
   * 2. Records for {@link RECORD_SECONDS} seconds with a live countdown.
   * 3. On stop: converts audio to WAV, sends to /transcribe, evaluates the result,
   *    updates the UI and speaks the feedback.
   */
  async function startRecording(stream: MediaStream): Promise<void> {
    chunks = [];
    micDisabled = true;

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunks, { type: mediaRecorder!.mimeType });

      try {
        const wavBuffer = await blobToWav(blob);
        const form = new FormData();
        form.append("audio", new Blob([wavBuffer], { type: "audio/wav" }), "audio.wav");
        form.append("words", JSON.stringify([currentEntry.word]));
        const res = await fetch("/transcribe", { method: "POST", body: form });
        const { transcript } = await res.json() as { transcript: string };

        const outcome = processAnswer(transcript, currentEntry.word, retryCount);
        showIllustration = false;
        feedbackHtml = outcome.screenMessage;
        feedbackClass = outcome.screenClass;
        status = '';
        cindyMood = outcome.cindyMood;

        if (outcome.correct) {
          retryCount = 0;
          showNext = true;
          micDisabled = true;
          speakWord(outcome.spoken!, { raw: true }); // fire-and-forget for "You got it!"
        } else {
          retryCount++;
          // Wait for both TTS to finish and 2 s to elapse, then restore the word prompt.
          await Promise.all([
            speakWord(outcome.spoken!, { raw: true }),
            new Promise(r => setTimeout(r, ERROR_DISPLAY_MS)),
          ]);
          showPrompt();
          status = "Press the mic to record";
          micDisabled = false;
        }
      } catch (err) {
        feedbackHtml = "(transcription error)";
        console.error(err);
        micDisabled = false;
      }
    };

    mediaRecorder.start();

    status = "Get ready…";
    if (!wordSpoken) { speakWord(currentEntry.word); wordSpoken = true; }
    await new Promise(r => setTimeout(r, 1000));

    isRecording = true;
    let remaining = RECORD_SECONDS;
    countdownValue = remaining;
    status = "Speak now!";

    timerInterval = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        countdownValue = remaining;
      } else {
        clearInterval(timerInterval!);
        timerInterval = null;
        countdownValue = null;
        mediaRecorder!.stop();
        isRecording = false;
        status = "Processing…";
      }
    }, 1000);
  }
</script>

<a href="/" class="back-btn">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
  Lessons
</a>
<h1>TalkPlay</h1>

<SpeechBubble
  {cindyMood}
  illustration={currentEntry.illustration}
  {showIllustration}
  {feedbackHtml}
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
</style>
