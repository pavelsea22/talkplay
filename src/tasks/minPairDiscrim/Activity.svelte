<script lang="ts">
  import { onMount } from 'svelte';
  import { speakWord } from '../../client/activity/audio';
  import { evaluateMinPairDiscrim } from './index';
  import type { MinPairDiscrimTask } from './index';
  import type { TaskOutcome } from '../shared/types';

  const MAX_RETRIES = 3;

  interface Props {
    task: MinPairDiscrimTask;
    /** Called once, when the task is definitively passed or failed. */
    onComplete: (outcome: TaskOutcome) => void;
  }

  let { task, onComplete }: Props = $props();

  const targetWordStr = $derived(
    task.targetWord === 'A' ? task.wordA.word : task.wordB.word
  );

  let retryCount = $state(0);
  let locked = $state(false);              // true while feedback is showing
  let selectedCard = $state<'A' | 'B' | null>(null);
  let cardFeedback = $state<'correct' | 'incorrect' | null>(null);
  let statusMsg = $state('');
  /** True when the initial autoplay was blocked by the browser. */
  let needsTap = $state(false);

  async function playTarget(): Promise<void> {
    needsTap = false;
    await speakWord(`Click the word you hear: ${targetWordStr}`, { raw: true })
      .catch(err => {
        if ((err as DOMException)?.name === 'NotAllowedError') {
          needsTap = true;   // autoplay blocked — prompt the user to tap
        } else {
          console.error('TTS failed:', err);
        }
      });
  }

  /** Handles a card click. Evaluates, shows feedback, then retries or completes. */
  async function handleChoice(choice: 'A' | 'B'): Promise<void> {
    if (locked) return;
    locked = true;
    selectedCard = choice;

    const result = evaluateMinPairDiscrim(task, choice, retryCount);

    if (result.outcome === 'passed') {
      cardFeedback = 'correct';
      statusMsg = result.screenMessage;
      if (result.spoken) {
        await speakWord(result.spoken, { raw: true }).catch(err => console.error('TTS failed:', err));
      }
      await new Promise(r => setTimeout(r, 900));
      onComplete('passed');
    } else {
      cardFeedback = 'incorrect';
      statusMsg = result.screenMessage;
      retryCount++;
      if (result.spoken) {
        await speakWord(result.spoken, { raw: true }).catch(err => console.error('TTS failed:', err));
      }
      await new Promise(r => setTimeout(r, 800));

      if (retryCount >= MAX_RETRIES) {
        onComplete('failed');
      } else {
        // Reset for another attempt and replay the target word.
        selectedCard = null;
        cardFeedback = null;
        statusMsg = '';
        locked = false;
        await playTarget();
      }
    }
  }

  // Speak the target word as soon as the task mounts.
  onMount(() => { playTarget(); });
</script>

<div class="container">
  <p class="prompt">Choose the right word</p>

  <div class="cards">
    {#each (['A', 'B'] as const) as side}
      {@const word = side === 'A' ? task.wordA : task.wordB}
      {@const feedback = selectedCard === side ? cardFeedback : null}
      <button
        class="word-card {feedback ?? ''}"
        onclick={() => handleChoice(side)}
        disabled={locked}
        aria-label="Choose {word.word}"
      >
        <img
          src="/{word.illustration}"
          alt={word.word}
          class="card-illustration"
          onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
        />
        <span class="card-label">{word.word}</span>
      </button>
    {/each}
  </div>

  <p class="status-msg">{statusMsg}</p>

  <button
    class="listen-btn {needsTap ? 'needs-tap' : ''}"
    onclick={playTarget}
    disabled={locked}
    aria-label="Listen again"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
    {needsTap ? 'Click to hear the word' : 'Listen again'}
  </button>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-6);
    padding: var(--space-4) 0;
  }

  .prompt {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.375rem;
    font-weight: 600;
    color: var(--color-on-surface-variant);
    margin: 0;
  }

  .cards {
    display: flex;
    gap: var(--space-6);
  }

  .word-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    width: 148px;
    min-height: 168px;
    padding: var(--space-6) var(--space-4);
    background: var(--color-surface-container);
    border-radius: var(--radius-xl);
    outline: 1px solid rgba(141, 177, 209, 0.15);
    border: none;
    cursor: pointer;
    transition:
      background  var(--duration-base) var(--ease-in-out),
      box-shadow  var(--duration-base) var(--ease-in-out),
      transform   var(--duration-fast) var(--ease-in-out);
  }

  .word-card:hover:not(:disabled) {
    background: var(--color-surface-bright);
    box-shadow: var(--shadow-ambient);
  }

  .word-card:active:not(:disabled) {
    transform: scale(0.95);
  }

  .word-card:disabled {
    cursor: default;
  }

  .word-card.correct {
    background: var(--color-secondary-container);
    outline-color: var(--color-secondary);
    outline-width: 2px;
    animation: pop-in var(--duration-base) var(--ease-out-soft);
  }

  .word-card.incorrect {
    background: #fecaca;
    outline-color: #b91c1c;
    outline-width: 2px;
    animation: shake var(--duration-slow) var(--ease-in-out);
  }

  @keyframes pop-in {
    0%   { transform: scale(1); }
    50%  { transform: scale(1.06); }
    100% { transform: scale(1); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    40%      { transform: translateX(6px); }
    60%      { transform: translateX(-4px); }
    80%      { transform: translateX(4px); }
  }

  .card-illustration {
    width: 72px;
    height: 72px;
    object-fit: contain;
  }

  .card-label {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.375rem;
    font-weight: 700;
    color: var(--color-on-surface);
  }

  .status-msg {
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-on-surface-variant);
    min-height: 1.4em;
    margin: 0;
    text-align: center;
  }

  .listen-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-6);
    background: var(--color-surface-container);
    border: none;
    border-radius: var(--radius-full);
    outline: 1px solid rgba(141, 177, 209, 0.15);
    color: var(--color-on-surface-variant);
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition:
      background  var(--duration-base) var(--ease-in-out),
      box-shadow  var(--duration-base) var(--ease-in-out);
  }

  .listen-btn:hover:not(:disabled) {
    background: var(--color-surface-container-high);
    box-shadow: var(--shadow-ambient);
  }

  .listen-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .listen-btn.needs-tap {
    background: var(--color-primary-container);
    color: var(--color-primary);
    animation: pulse-btn 1.2s ease-in-out infinite;
  }

  @keyframes pulse-btn {
    0%, 100% { box-shadow: 0 0 0 0   rgba(0, 98, 134, 0.2); }
    50%       { box-shadow: 0 0 0 8px rgba(0, 98, 134, 0);   }
  }
</style>
