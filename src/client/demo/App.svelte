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
  :global(:root) {
    /* === Surfaces === */
    --color-surface:                   #f1f7ff;
    --color-surface-dim:               #afd9ff;
    --color-surface-bright:            #dff0ff;
    --color-surface-container-lowest:  #ffffff;
    --color-surface-container-low:     #e7f2ff;
    --color-surface-container:         #d7eaff;
    --color-surface-container-high:    #cce5ff;
    --color-surface-container-highest: #c0e1ff;

    /* === On-Surface Text === */
    --color-on-surface:         #04324c;
    --color-on-surface-variant: #3b5f7c;

    /* === Primary === */
    --color-primary:           #006286;
    --color-primary-container: #37bcf7;
    --color-on-primary:        #ffffff;

    /* === Secondary === */
    --color-secondary:              #3a6b2a;
    --color-secondary-container:    #c2efb1;
    --color-on-secondary-container: #355b2b;

    /* === Tertiary (Reward) === */
    --color-tertiary:           #8f4900;
    --color-tertiary-container: #fe9742;
    --color-on-tertiary:        #ffffff;

    /* === Outline === */
    --color-outline-variant: #8db1d1;

    /* === Roundedness === */
    --radius-sm:   0.5rem;
    --radius-md:   1rem;
    --radius-lg:   2rem;
    --radius-xl:   3rem;
    --radius-full: 9999px;

    /* === Spacing === */
    --space-1:  0.25rem;
    --space-2:  0.5rem;
    --space-3:  0.75rem;
    --space-4:  1rem;
    --space-6:  1.5rem;
    --space-8:  2rem;
    --space-10: 2.75rem;
    --space-12: 3rem;
    --space-16: 4rem;

    /* === Elevation / Shadow === */
    --shadow-ambient: 0 12px 32px rgba(4, 50, 76, 0.06);

    /* === Motion === */
    --duration-fast:  150ms;
    --duration-base:  250ms;
    --duration-slow:  400ms;
    --ease-out-soft:  cubic-bezier(0.22, 1, 0.36, 1);
    --ease-in-out:    cubic-bezier(0.4, 0, 0.2, 1);
  }

  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }

  :global(body) {
    min-height: 100vh;
    background: var(--color-surface);
    color: var(--color-on-surface);
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
  }

  :global(#app) {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(*, *::before, *::after) {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }

  header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid rgba(141, 177, 209, 0.2);
    flex-shrink: 0;
  }

  .home-link {
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-on-surface-variant);
    text-decoration: none;
    white-space: nowrap;
    transition: color var(--duration-base) var(--ease-in-out);
  }
  .home-link:hover { color: var(--color-on-surface); }

  .title {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-on-surface-variant);
    margin-right: auto;
  }

  .tabs {
    display: flex;
    gap: var(--space-2);
  }

  .tab {
    padding: var(--space-1) var(--space-4);
    border: none;
    border-radius: var(--radius-full);
    background: var(--color-surface-container);
    color: var(--color-on-surface-variant);
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition:
      background var(--duration-base) var(--ease-in-out),
      color     var(--duration-base) var(--ease-in-out);
  }

  .tab:hover {
    background: var(--color-surface-container-high);
    color: var(--color-on-surface);
  }

  .tab.active {
    background: var(--color-primary);
    color: var(--color-on-primary);
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
