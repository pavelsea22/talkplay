<script lang="ts">
  import { pickLesson } from '../../tasks';
  import type { Task, TaskStatus, TaskOutcome } from '../../tasks';
  import { randomPraise } from '../../tasks/shared/praise';
  import { recordPlayedToday } from '../streaks';
  import LessonProgress from './LessonProgress.svelte';
  import DrillWordActivity from '../../tasks/drillWord/Activity.svelte';
  import MinPairActivity from '../../tasks/minPairDiscrim/Activity.svelte';
  import WordSortActivity from './WordSortActivity.svelte';
  import PopTheBalloon from '../minigames/PopTheBalloon.svelte';

  const LESSON_SIZE = 5;
  const sound = new URLSearchParams(window.location.search).get('sound') ?? undefined;

  let tasks = $state<Task[]>(pickLesson(LESSON_SIZE, sound));
  let statuses = $state<TaskStatus[]>(Array.from({ length: LESSON_SIZE }, () => 'pending'));
  let taskIndex = $state(0);
  let lessonComplete = $state(false);
  let showMinigame = $state(false);
  let completePraise = $state('');

  let currentTask = $derived(tasks[taskIndex]);

  /**
   * Called by whichever Activity component is currently mounted.
   * Updates the progress bar and advances to the next task (or ends the lesson).
   */
  function handleTaskComplete(outcome: TaskOutcome): void {
    statuses = statuses.map((s, i) => i === taskIndex ? outcome : s);
    const next = taskIndex + 1;
    if (next >= tasks.length) {
      lessonComplete = true;
      showMinigame = true;
      completePraise = randomPraise();
      recordPlayedToday();
    } else {
      taskIndex = next;
    }
  }

  /** Picks a fresh lesson and resets all state. */
  function handlePlayAgain(): void {
    tasks = pickLesson(LESSON_SIZE, sound);
    statuses = Array.from({ length: LESSON_SIZE }, () => 'pending' as TaskStatus);
    taskIndex = 0;
    lessonComplete = false;
  }
</script>

<div class="progress-container">
  <LessonProgress {statuses} currentIndex={taskIndex} />
</div>

<a href="/" class="back-btn">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
  Lessons
</a>
<h1>TalkPlay</h1>

{#if lessonComplete}
  <div class="complete">
    <p class="complete-title">{completePraise} 🎉</p>
    <p class="complete-sub">You finished the lesson!</p>
    <button class="play-again-btn" onclick={handlePlayAgain}>Play Again</button>
  </div>
{:else}
  <!--
    {#key taskIndex} forces the Activity component to fully remount on every
    task change, so each component starts with a clean slate (fresh state,
    onMount TTS, etc.) regardless of whether the task type changes.
  -->
  {#key taskIndex}
    {#if currentTask.type === 'DrillWord'}
      <DrillWordActivity task={currentTask} onComplete={handleTaskComplete} />
    {:else if currentTask.type === 'MinPairDiscrimination'}
      <MinPairActivity task={currentTask} onComplete={handleTaskComplete} />
    {:else if currentTask.type === 'wordSort'}
      <WordSortActivity task={currentTask} onComplete={handleTaskComplete} />
    {/if}
  {/key}
{/if}

{#if showMinigame}
  <div class="minigame-overlay">
    <div class="minigame-card">
      <h2 class="minigame-title">Pop the Balloons!</h2>
      <PopTheBalloon onClose={() => showMinigame = false} />
    </div>
  </div>
{/if}

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
    justify-content: center;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(*, *::before, *::after) {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }

  h1 {
    position: fixed;
    top: 1.2rem;
    right: var(--space-6);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.375rem;
    font-weight: 700;
    color: var(--color-primary);
    margin: 0;
  }

  .back-btn {
    position: fixed;
    top: 1.1rem;
    left: var(--space-6);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-on-surface-variant);
    text-decoration: none;
    transition: color var(--duration-base) var(--ease-in-out);
  }

  .back-btn:hover { color: var(--color-on-surface); }

  .progress-container {
    position: fixed;
    top: 1.1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
  }

  .complete {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    text-align: center;
  }

  .complete-title {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--color-on-surface);
  }

  .complete-sub {
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 1.125rem;
    font-weight: 400;
    color: var(--color-on-surface-variant);
  }

  .play-again-btn {
    margin-top: var(--space-2);
    padding: var(--space-3) var(--space-8);
    border: none;
    border-radius: var(--radius-full);
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
    color: var(--color-on-primary);
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-ambient);
    transition:
      opacity      var(--duration-fast) var(--ease-in-out),
      transform    var(--duration-fast) var(--ease-in-out);
  }

  .play-again-btn:hover  { opacity: 0.9; }
  .play-again-btn:active { transform: scale(0.95); }

  .minigame-overlay {
    position: fixed;
    inset: 0;
    background: var(--color-surface-container-lowest);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(20px);
  }

  @supports (backdrop-filter: blur(1px)) {
    .minigame-overlay {
      background: rgba(255, 255, 255, 0.6);
    }
  }

  .minigame-card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    width: 320px;
    height: 520px;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-ambient);
    outline: 1px solid rgba(141, 177, 209, 0.15);
  }

  .minigame-title {
    text-align: center;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.375rem;
    font-weight: 700;
    color: var(--color-on-surface);
    margin-bottom: var(--space-2);
  }
</style>
