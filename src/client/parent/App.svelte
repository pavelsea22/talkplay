<script lang="ts">
  import { WORD_GROUPS } from '../../words';
  import {
    getParentConfig,
    setParentConfig,
    getTodayStatus,
    resetTodayLesson,
    DEFAULT_PARENT_CONFIG,
    type MicAnimation,
  } from '../lessonState';

  const initial = getParentConfig();
  let selectedSounds = $state<Set<string>>(new Set(initial.sounds));
  let exerciseCount = $state(initial.exerciseCount);
  let showConfidence = $state(initial.showConfidence);
  let micAnimation = $state<MicAnimation>(initial.micAnimation);
  let todayStatus = $state(getTodayStatus());

  const exerciseOptions = [3, 5, 7, 10, 15];

  /** Persists the current config immediately. */
  function saveConfig(): void {
    setParentConfig({
      sounds: Array.from(selectedSounds),
      exerciseCount,
      showConfidence,
      micAnimation,
    });
  }

  /** Toggles a sound in the selection. Always keeps at least one selected. */
  function toggleSound(sound: string): void {
    if (selectedSounds.has(sound)) {
      if (selectedSounds.size === 1) return;
      selectedSounds.delete(sound);
    } else {
      selectedSounds.add(sound);
    }
    selectedSounds = new Set(selectedSounds);
    saveConfig();
  }

  /** Resets selection to the all-sounds default and saves immediately. */
  function reset(): void {
    selectedSounds = new Set(DEFAULT_PARENT_CONFIG.sounds);
    exerciseCount = DEFAULT_PARENT_CONFIG.exerciseCount;
    showConfidence = DEFAULT_PARENT_CONFIG.showConfidence;
    micAnimation = DEFAULT_PARENT_CONFIG.micAnimation;
    saveConfig();
  }

  /** Resets today's lesson to not_started so the child can redo it. */
  function handleResetTodayLesson(): void {
    resetTodayLesson();
    todayStatus = getTodayStatus();
  }
</script>

<a href="/" class="back-btn">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
  Home
</a>

<header class="hero">
  <p class="welcome">Parent Portal</p>
  <h1 class="title">Configure Today's Lesson</h1>
</header>

<section class="panel">
  <h2 class="section-title">Sounds to practise</h2>
  <p class="section-hint">Pick one or more. Exercises will be split evenly across them.</p>
  <div class="sound-grid">
    {#each WORD_GROUPS as group (group.sound)}
      {@const checked = selectedSounds.has(group.sound)}
      <button
        type="button"
        class="sound-chip"
        class:active={checked}
        onclick={() => toggleSound(group.sound)}
        aria-pressed={checked}
      >
        /{group.sound.toUpperCase()}/
      </button>
    {/each}
  </div>
</section>

<section class="panel">
  <h2 class="section-title">Number of exercises</h2>
  <p class="section-hint">How long the daily lesson should be.</p>
  <div class="count-grid">
    {#each exerciseOptions as count (count)}
      <button
        type="button"
        class="count-chip"
        class:active={exerciseCount === count}
        onclick={() => { exerciseCount = count; saveConfig(); }}
        aria-pressed={exerciseCount === count}
      >
        {count}
      </button>
    {/each}
  </div>
</section>

<section class="panel">
  <h2 class="section-title">Today's lesson</h2>
  <p class="section-hint">
    Current status: <strong>{todayStatus.replace('_', ' ')}</strong>
  </p>
  <button
    type="button"
    class="reset-lesson-btn"
    disabled={todayStatus === 'not_started'}
    onclick={handleResetTodayLesson}
  >
    Reset to not started
  </button>
</section>

<details class="debug-panel">
  <summary class="debug-summary">Developer settings</summary>
  <label class="debug-toggle">
    <input
      type="checkbox"
      bind:checked={showConfidence}
      onchange={() => saveConfig()}
    />
    Show debug information
  </label>
  <div class="debug-field">
    <span class="debug-label">Minigames</span>
    <a href="/activity/?debug-minigame=maze" target="_blank" class="debug-link">
      🐰 Preview Maze ↗
    </a>
  </div>
  <div class="debug-field">
    <span class="debug-label">Mic button animation</span>
    <div class="mic-anim-options">
      {#each ([['fill', 'Level fill'], ['halo', 'Halo glow']] as const) as [value, label]}
        <label class="mic-anim-option">
          <input
            type="radio"
            name="micAnimation"
            {value}
            checked={micAnimation === value}
            onchange={() => { micAnimation = value; saveConfig(); }}
          />
          {label}
        </label>
      {/each}
    </div>
  </div>
</details>

<div class="actions">
  <button type="button" class="reset-btn" onclick={reset}>Reset to defaults</button>
</div>

<style>
  /* Tokens (colors, spacing, radii, motion) are in src/client/tokens.css,
     imported by main.ts. Only page-specific layout lives here. */

  :global(body) {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-12) var(--space-4) var(--space-8);
  }

  .back-btn {
    position: fixed;
    top: var(--space-6);
    left: var(--space-6);
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-full);
    background: var(--color-surface-container);
    color: var(--color-on-surface-variant);
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    transition: background var(--duration-base) var(--ease-in-out);
  }
  .back-btn:hover {
    background: var(--color-surface-container-high);
    color: var(--color-on-surface);
  }

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-10);
  }
  .welcome {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-on-surface-variant);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .title {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    text-align: center;
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .panel {
    width: 100%;
    max-width: 32rem;
    padding: var(--space-6);
    margin-bottom: var(--space-6);
    background: var(--color-surface-container-lowest);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-ambient);
  }
  .section-title {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.125rem;
    font-weight: 700;
    margin-bottom: var(--space-1);
  }
  .section-hint {
    font-size: 0.875rem;
    color: var(--color-on-surface-variant);
    margin-bottom: var(--space-4);
  }

  .sound-grid, .count-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .sound-chip, .count-chip {
    padding: var(--space-2) var(--space-4);
    border: 2px solid var(--color-outline-variant);
    border-radius: var(--radius-full);
    background: var(--color-surface-container-low);
    color: var(--color-on-surface);
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-in-out);
  }
  .sound-chip:hover, .count-chip:hover {
    border-color: var(--color-primary);
  }
  .sound-chip.active, .count-chip.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }

  .actions {
    display: flex;
    gap: var(--space-3);
    margin-top: var(--space-4);
  }
  .reset-btn {
    padding: var(--space-3) var(--space-8);
    border: none;
    border-radius: var(--radius-full);
    font-family: inherit;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-in-out);
    background: var(--color-surface-container);
    color: var(--color-on-surface-variant);
  }
  .reset-btn:hover {
    background: var(--color-surface-container-high);
  }

  .debug-panel {
    width: 100%;
    max-width: 32rem;
    margin-bottom: var(--space-4);
  }
  .debug-summary {
    font-size: 0.8125rem;
    color: var(--color-on-surface-variant);
    cursor: pointer;
    user-select: none;
    opacity: 0.6;
    padding: var(--space-1) 0;
  }
  .debug-summary:hover { opacity: 0.85; }
  .debug-toggle {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-3);
    font-size: 0.875rem;
    color: var(--color-on-surface-variant);
    cursor: pointer;
  }
  .debug-toggle input { cursor: pointer; }

  .debug-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-3);
    font-size: 0.875rem;
    color: var(--color-on-surface-variant);
  }

  .debug-label { font-size: 0.875rem; }

  .mic-anim-options {
    display: flex;
    gap: var(--space-4);
  }

  .mic-anim-option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
  }

  .mic-anim-option input { cursor: pointer; }

  .debug-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: 0.875rem;
    color: var(--color-primary);
    text-decoration: none;
    transition: opacity var(--duration-fast) var(--ease-in-out);
  }
  .debug-link:hover { opacity: 0.75; }

  .reset-lesson-btn {
    padding: var(--space-2) var(--space-6);
    border: 2px solid var(--color-outline-variant);
    border-radius: var(--radius-full);
    background: var(--color-surface-container-low);
    color: var(--color-on-surface-variant);
    font-family: inherit;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-in-out);
  }
  .reset-lesson-btn:not(:disabled):hover {
    border-color: var(--color-primary);
    color: var(--color-on-surface);
  }
  .reset-lesson-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
