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

  async function playTarget(): Promise<void> {
    await speakWord(targetWordStr).catch(err => console.error('TTS failed:', err));
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
        <img src="/{word.illustration}" alt={word.word} class="card-illustration" />
        <span class="card-label">{word.word}</span>
      </button>
    {/each}
  </div>

  <p class="status-msg">{statusMsg}</p>

  <button
    class="listen-btn"
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
    Listen again
  </button>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.4rem;
    padding: 1rem 0;
  }

  .prompt {
    font-size: 1.3rem;
    font-weight: 700;
    color: #9ca3af;
    margin: 0;
  }

  .cards {
    display: flex;
    gap: 1.4rem;
  }

  .word-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.7rem;
    width: 140px;
    padding: 1.2rem 1rem;
    background: #1e293b;
    border: 3px solid #374151;
    border-radius: 16px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
  }

  .word-card:hover:not(:disabled) {
    background: #273548;
    border-color: #4b5563;
  }

  .word-card:active:not(:disabled) {
    transform: scale(0.97);
  }

  .word-card:disabled {
    cursor: default;
  }

  .word-card.correct {
    border-color: #4ade80;
    box-shadow: 0 0 16px rgba(74, 222, 128, 0.4);
    animation: pop-in 0.2s ease;
  }

  .word-card.incorrect {
    border-color: #f87171;
    box-shadow: 0 0 16px rgba(248, 113, 113, 0.4);
    animation: shake 0.35s ease;
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
    font-size: 1.3rem;
    font-weight: 800;
    color: #f0f0f0;
  }

  .status-msg {
    font-size: 1.1rem;
    font-weight: 600;
    color: #9ca3af;
    min-height: 1.4em;
    margin: 0;
    text-align: center;
  }

  .listen-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1.4rem;
    background: #1e293b;
    border: 2px solid #374151;
    border-radius: 12px;
    color: #d1d5db;
    font-family: 'Baloo 2', system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .listen-btn:hover:not(:disabled) {
    background: #273548;
    border-color: #4b5563;
  }

  .listen-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
