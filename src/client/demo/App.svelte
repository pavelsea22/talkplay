<script lang="ts">
  import DrillWordActivity from '../../tasks/drillWord/Activity.svelte';
  import MinPairActivity from '../../tasks/minPairDiscrim/Activity.svelte';
  import WordSortActivity from '../activity/WordSortActivity.svelte';
  import type { Task, TaskOutcome } from '../../tasks';

  /** One hardcoded fixture per task type. Add an entry here when a new type is implemented. */
  const FIXTURES = [
    {
      label: 'DrillWord',
      task: {
        type: 'DrillWord',
        word: 'tea',
        illustration: 'images/words/tea.svg',
      } satisfies Task,
    },
    {
      label: 'MinPairDiscrimination',
      task: {
        type: 'MinPairDiscrimination',
        wordA: { word: 'tea', illustration: 'images/words/tea.svg' },
        wordB: { word: 'key', illustration: 'images/words/key.svg' },
        targetWord: 'A',
      } satisfies Task,
    },
    {
      label: 'WordSort',
      task: {
        type: 'wordSort',
        words: ['dog', 'duck', 'ten', 'top'],
        buckets: ['starts with /d/', 'starts with /t/'],
        correctBucket: {
          dog: 0,
          duck: 0,
          ten: 1,
          top: 1,
        },
      } satisfies Task,
    },
  ];

  let selectedIndex = $state(0);
  let resetKey = $state(0);   // incrementing this remounts the Activity with a clean slate

  let fixture = $derived(FIXTURES[selectedIndex]);

  function select(index: number): void {
    selectedIndex = index;
    resetKey++;
  }

  /** On task completion, log the outcome and remount so the demo can be tried again. */
  function handleComplete(outcome: TaskOutcome): void {
    console.info(`[demo] task completed: ${outcome}`);
    resetKey++;
  }
</script>

<header>
  <a href="/" class="home-link">← Lessons</a>
  <span class="title">Task Demo</span>
  <nav class="tabs">
    {#each FIXTURES as { label }, i}
      <button
        class="tab {selectedIndex === i ? 'active' : ''}"
        onclick={() => select(i)}
      >
        {label}
      </button>
    {/each}
  </nav>
</header>

<main>
  {#key resetKey}
    {#if fixture.task.type === 'DrillWord'}
      <DrillWordActivity task={fixture.task} onComplete={handleComplete} />
    {:else if fixture.task.type === 'MinPairDiscrimination'}
      <MinPairActivity task={fixture.task} onComplete={handleComplete} />
    {:else if fixture.task.type === 'wordSort'}
      <WordSortActivity task={fixture.task} onComplete={handleComplete} />
    {/if}
  {/key}
</main>

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
  }

  header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #1e293b;
    flex-shrink: 0;
  }

  .home-link {
    font-size: 0.95rem;
    font-weight: 600;
    color: #9ca3af;
    text-decoration: none;
    white-space: nowrap;
    transition: color 0.2s;
  }
  .home-link:hover { color: #f0f0f0; }

  .title {
    font-size: 1rem;
    font-weight: 700;
    color: #4b5563;
    margin-right: auto;
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
  }

  .tab {
    padding: 0.35rem 1rem;
    border: 2px solid #374151;
    border-radius: 8px;
    background: transparent;
    color: #9ca3af;
    font-family: 'Baloo 2', system-ui, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }

  .tab:hover { border-color: #4b5563; color: #f0f0f0; }

  .tab.active {
    border-color: #2563eb;
    background: #1e3a8a22;
    color: #60a5fa;
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
</style>
