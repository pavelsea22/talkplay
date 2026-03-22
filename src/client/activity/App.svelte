<script lang="ts">
  import { pickLesson } from '../../tasks';
  import type { Task, TaskStatus, TaskOutcome } from '../../tasks';
  import LessonProgress from './LessonProgress.svelte';
  import DrillWordActivity from '../../tasks/drillWord/Activity.svelte';
  import MinPairActivity from '../../tasks/minPairDiscrim/Activity.svelte';
  import PopTheBalloon from '../minigames/PopTheBalloon.svelte';

  const LESSON_SIZE = 5;

  let tasks = $state<Task[]>(pickLesson(LESSON_SIZE));
  let statuses = $state<TaskStatus[]>(Array.from({ length: LESSON_SIZE }, () => 'pending'));
  let taskIndex = $state(0);
  let lessonComplete = $state(false);
  let showMinigame = $state(false);

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
    } else {
      taskIndex = next;
    }
  }

  /** Picks a fresh lesson and resets all state. */
  function handlePlayAgain(): void {
    tasks = pickLesson(LESSON_SIZE);
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
    <p class="complete-title">Great job! 🎉</p>
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

  .play-again-btn:hover  { background: #1d4ed8; }
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
