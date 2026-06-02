<script lang="ts">
  import { pickLesson, pickLessonForSounds } from '../../tasks';
  import type { Task, TaskStatus, TaskOutcome } from '../../tasks';
  import { randomPraise } from '../../tasks/shared/praise';
  import { recordPlayedToday } from '../streaks';
  import {
    getParentConfig,
    markTodayStarted,
    markTodayCompleted,
  } from '../lessonState';
  import { recordExercise } from '../dailyStats';
  import LessonProgress from './LessonProgress.svelte';
  import DrillWordActivity from '../../tasks/drillWord/Activity.svelte';
  import MinPairActivity from '../../tasks/minPairDiscrim/Activity.svelte';
  import WordSortActivity from './WordSortActivity.svelte';
  import Maze from '../minigames/Maze.svelte';
  import PopTheBalloon from '../minigames/PopTheBalloon.svelte';
  import MinigamePicker, { type MinigameId } from '../minigames/MinigamePicker.svelte';
  import CompletionCertificate from './CompletionCertificate.svelte';

  /** Number of tasks added by the "more practice" mode after today's lesson. */
  const EXTRA_PRACTICE_SIZE = 5;
  /** Default lesson size for free-practice (single-sound) mode. */
  const FREE_PRACTICE_SIZE = 5;

  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode'); // 'today' | 'more' | 'earn' | null (free practice)
  const sound = params.get('sound') ?? undefined;
  const countParam = params.get('count');
  /** Minutes of screen time earned. Defaults to 5 for today's lesson. */
  const earnMinutes = mode === 'earn' && params.get('minutes') !== null
    ? parseInt(params.get('minutes')!, 10)
    : 5;

  /** Picks the initial task list based on the URL mode. */
  function buildLesson(): Task[] {
    if (mode === 'today') {
      const cfg = getParentConfig();
      return pickLessonForSounds(cfg.exerciseCount, cfg.sounds);
    }
    if (mode === 'more') {
      const cfg = getParentConfig();
      return pickLessonForSounds(EXTRA_PRACTICE_SIZE, cfg.sounds);
    }
    if (mode === 'earn' && countParam !== null) {
      const cfg = getParentConfig();
      return pickLessonForSounds(parseInt(countParam, 10), cfg.sounds);
    }
    return pickLesson(FREE_PRACTICE_SIZE, sound);
  }

  const { showConfidence, micAnimation } = getParentConfig();

  // ?debug-minigame=maze|balloon opens that game immediately without completing a lesson.
  const debugMinigame = params.get('debug-minigame') as MinigameId | null;

  let tasks = $state<Task[]>(buildLesson());
  let statuses = $state<TaskStatus[]>(tasks.map(() => 'pending' as TaskStatus));
  let taskIndex = $state(0);
  let lessonComplete = $state(false);
  /** Controls the picker overlay shown at lesson end. */
  let showPicker = $state(false);
  /** The mini game the user chose; null until they pick one. */
  let selectedMinigame = $state<MinigameId | null>(
    debugMinigame === 'maze' || debugMinigame === 'balloon' ? debugMinigame : null,
  );
  /** Whether the selected mini game overlay is visible. */
  let showMinigame = $state(selectedMinigame !== null);
  /** Whether the "Your time is up!" overlay is visible. */
  let showTimeUp = $state(false);
  let showCertificate = $state(false);
  let completePraise = $state('');

  const MINIGAME_DURATION_MS = 5 * 60 * 1000;

  $effect(() => {
    if (!showMinigame) return;
    const id = setTimeout(() => {
      showMinigame = false;
      showTimeUp = true;
    }, MINIGAME_DURATION_MS);
    return () => clearTimeout(id);
  });

  let currentTask = $derived(tasks[taskIndex]);

  // Today's-lesson mode marks progress in localStorage so the home screen can
  // show the right CTA on next visit.
  if (mode === 'today') {
    markTodayStarted();
  }

  /**
   * Called by whichever Activity component is currently mounted.
   * Updates the progress bar and advances to the next task (or ends the lesson).
   */
  function handleTaskComplete(outcome: TaskOutcome): void {
    recordExercise(outcome);
    statuses = statuses.map((s, i) => i === taskIndex ? outcome : s);
    const next = taskIndex + 1;
    if (next >= tasks.length) {
      lessonComplete = true;
      showPicker = true;
      completePraise = randomPraise();
      recordPlayedToday();
      if (mode === 'today') {
        markTodayCompleted();
        showCertificate = true;
      } else if (mode === 'earn') {
        showCertificate = true;
      }
    } else {
      taskIndex = next;
    }
  }

  /** Picks a fresh lesson and resets all state. */
  function handlePlayAgain(): void {
    tasks = buildLesson();
    statuses = tasks.map(() => 'pending' as TaskStatus);
    taskIndex = 0;
    lessonComplete = false;
  }
</script>

<header class="top-bar">
  <div class="top-row">
    <a href="/" class="back-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      Lessons
    </a>
    <h1>TalkPlay</h1>
  </div>
  <div class="progress-container">
    <LessonProgress {statuses} currentIndex={taskIndex} />
  </div>
</header>

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
      <DrillWordActivity task={currentTask} onComplete={handleTaskComplete} {showConfidence} {micAnimation} />
    {:else if currentTask.type === 'MinPairDiscrimination'}
      <MinPairActivity task={currentTask} onComplete={handleTaskComplete} />
    {:else if currentTask.type === 'wordSort'}
      <WordSortActivity task={currentTask} onComplete={handleTaskComplete} />
    {/if}
  {/key}
{/if}

{#if showPicker}
  <MinigamePicker onPick={(game) => {
    selectedMinigame = game;
    showPicker = false;
    showMinigame = true;
  }} />
{/if}

{#if showMinigame}
  <div class="minigame-overlay">
    {#if selectedMinigame === 'maze'}
      <div class="minigame-card maze-card">
        <h2 class="minigame-title">Find the Way! 🐰</h2>
        <Maze onClose={() => showMinigame = false} />
      </div>
    {:else if selectedMinigame === 'balloon'}
      <div class="minigame-card">
        <h2 class="minigame-title">Pop the Balloons! 🎈</h2>
        <PopTheBalloon onClose={() => showMinigame = false} />
      </div>
    {/if}
  </div>
{/if}

{#if showTimeUp}
  <div class="minigame-overlay">
    <div class="timeup-card">
      <p class="timeup-emoji">⏰</p>
      <h2 class="timeup-heading">Your time is up!</h2>
      <button class="timeup-btn" onclick={() => window.location.href = '/'}>OK</button>
    </div>
  </div>
{/if}

{#if showCertificate}
  <CompletionCertificate onClose={() => showCertificate = false} {earnMinutes} />
{/if}

<style>
  /* Tokens (colors, spacing, radii, motion) are in src/client/tokens.css,
     imported by main.ts. Only page-specific layout lives here. */

  :global(#app) {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /* Reserve space for the fixed top-bar so centering starts below it.
       3.25rem = 1rem (top-bar base top-padding) + ~1.5rem (content row) + 0.75rem (bottom-padding).
       env(safe-area-inset-top) shifts the whole bar down on notched iPhones. */
    /* 4.5rem = 1rem (top padding) + ~1.65rem (title row) + 0.5rem (gap) + 0.625rem (progress) + 0.75rem (bottom padding) */
    padding-top: calc(env(safe-area-inset-top, 0px) + 4.5rem);
  }

  .top-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    /* env(safe-area-inset-top) offsets past the iOS status bar; +1rem adds
       breathing room. calc() is more compatible than max(1rem, env(...))
       on older iOS. Background prevents page content bleeding through. */
    background: var(--color-surface);
    padding: calc(env(safe-area-inset-top, 0px) + 1rem) var(--space-6) 0.75rem;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    z-index: 10;
  }

  .top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h1 {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.375rem;
    font-weight: 700;
    color: var(--color-primary);
    margin: 0;
    white-space: nowrap;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-on-surface-variant);
    text-decoration: none;
    white-space: nowrap;
    transition: color var(--duration-base) var(--ease-in-out);
  }

  .back-btn:hover { color: var(--color-on-surface); }

  .progress-container {
    display: flex;
    justify-content: center;
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

  /*
   * Maze card sizing — must stay in sync with PORTRAIT_BREAKPOINT (500 px)
   * and the cell geometry in Maze.svelte (CELL=28, WALL=2, STEP=30):
   *
   *   Landscape (12×9):  CW = 12×30+2 = 362 px  →  card = 362+32 = 394 px
   *   Portrait  (9×12):  CW = 9×30+2  = 272 px  →  card = 272+32 = 304 px
   *
   * Inner width equals CW exactly → canvas renders at 1:1, no fractional CSS
   * scaling, walls are perfectly uniform.
   */
  .maze-card {
    width: min(394px, calc(100vw - var(--space-4)));
    padding-inline: var(--space-4);
    height: auto;
  }

  /* Portrait-mobile layout: narrower card matches the 9-column canvas. */
  @media (max-width: 499px) {
    .maze-card {
      width: min(304px, calc(100vw - var(--space-4)));
    }
  }

  .timeup-card {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px);
    border-radius: var(--radius-xl);
    padding: var(--space-8) var(--space-8);
    width: min(300px, calc(100vw - var(--space-8)));
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    box-shadow: var(--shadow-ambient);
    outline: 1px solid rgba(141, 177, 209, 0.15);
    text-align: center;
  }

  .timeup-emoji {
    font-size: 3rem;
    line-height: 1;
    margin: 0;
  }

  .timeup-heading {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-on-surface);
    margin: 0;
  }

  .timeup-btn {
    margin-top: var(--space-2);
    padding: var(--space-3) var(--space-10);
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
      opacity   var(--duration-fast) var(--ease-in-out),
      transform var(--duration-fast) var(--ease-in-out);
  }

  .timeup-btn:hover  { opacity: 0.9; }
  .timeup-btn:active { transform: scale(0.95); }
</style>
