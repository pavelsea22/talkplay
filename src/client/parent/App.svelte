<script lang="ts">
  import { WORD_GROUPS } from '../../words';
  import {
    getParentConfig,
    setParentConfig,
    DEFAULT_PARENT_CONFIG,
  } from '../lessonState';

  const initial = getParentConfig();
  let selectedSounds = $state<Set<string>>(new Set(initial.sounds));
  let exerciseCount = $state(initial.exerciseCount);
  let saved = $state(false);

  const exerciseOptions = [3, 5, 7, 10, 15];

  /** Toggles a sound in the selection. Always keeps at least one selected. */
  function toggleSound(sound: string): void {
    saved = false;
    if (selectedSounds.has(sound)) {
      if (selectedSounds.size === 1) return;
      selectedSounds.delete(sound);
    } else {
      selectedSounds.add(sound);
    }
    selectedSounds = new Set(selectedSounds);
  }

  /** Persists config and shows a brief confirmation. */
  function save(): void {
    setParentConfig({
      sounds: Array.from(selectedSounds),
      exerciseCount,
    });
    saved = true;
  }

  /** Resets selection to the all-sounds default. */
  function reset(): void {
    selectedSounds = new Set(DEFAULT_PARENT_CONFIG.sounds);
    exerciseCount = DEFAULT_PARENT_CONFIG.exerciseCount;
    saved = false;
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
        onclick={() => { exerciseCount = count; saved = false; }}
        aria-pressed={exerciseCount === count}
      >
        {count}
      </button>
    {/each}
  </div>
</section>

<div class="actions">
  <button type="button" class="reset-btn" onclick={reset}>Reset</button>
  <button type="button" class="save-btn" onclick={save}>Save</button>
</div>

{#if saved}
  <p class="saved-msg" role="status">Saved ✓</p>
{/if}

<style>
  :global(:root) {
    --color-surface:                   #f1f7ff;
    --color-surface-dim:               #afd9ff;
    --color-surface-bright:            #dff0ff;
    --color-surface-container-lowest:  #ffffff;
    --color-surface-container-low:     #e7f2ff;
    --color-surface-container:         #d7eaff;
    --color-surface-container-high:    #cce5ff;
    --color-surface-container-highest: #c0e1ff;

    --color-on-surface:         #04324c;
    --color-on-surface-variant: #3b5f7c;

    --color-primary:           #006286;
    --color-primary-container: #37bcf7;
    --color-on-primary:        #ffffff;

    --color-secondary:              #3a6b2a;
    --color-secondary-container:    #c2efb1;
    --color-on-secondary-container: #355b2b;

    --color-outline-variant: #8db1d1;

    --radius-sm:   0.5rem;
    --radius-md:   1rem;
    --radius-lg:   2rem;
    --radius-xl:   3rem;
    --radius-full: 9999px;

    --space-1:  0.25rem;
    --space-2:  0.5rem;
    --space-3:  0.75rem;
    --space-4:  1rem;
    --space-6:  1.5rem;
    --space-8:  2rem;
    --space-10: 2.75rem;
    --space-12: 3rem;
    --space-16: 4rem;

    --shadow-ambient: 0 12px 32px rgba(4, 50, 76, 0.06);

    --duration-fast:  150ms;
    --duration-base:  250ms;
    --duration-slow:  400ms;
    --ease-out-soft:  cubic-bezier(0.22, 1, 0.36, 1);
    --ease-in-out:    cubic-bezier(0.4, 0, 0.2, 1);
  }

  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }

  :global(body) {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--color-surface);
    color: var(--color-on-surface);
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    padding: var(--space-12) var(--space-4) var(--space-8);
  }

  @media (prefers-reduced-motion: reduce) {
    :global(*, *::before, *::after) {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
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
  .save-btn, .reset-btn {
    padding: var(--space-3) var(--space-8);
    border: none;
    border-radius: var(--radius-full);
    font-family: inherit;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-in-out);
  }
  .save-btn {
    background: var(--color-primary);
    color: white;
  }
  .save-btn:hover {
    box-shadow: var(--shadow-ambient);
    transform: translateY(-1px);
  }
  .reset-btn {
    background: var(--color-surface-container);
    color: var(--color-on-surface-variant);
  }
  .reset-btn:hover {
    background: var(--color-surface-container-high);
  }

  .saved-msg {
    margin-top: var(--space-4);
    color: var(--color-primary);
    font-weight: 600;
  }
</style>
