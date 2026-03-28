<script lang="ts">
  import { WORD_GROUPS } from '../../words';
  import LessonCard from './LessonCard.svelte';
  import StreakChart from './StreakChart.svelte';
</script>

<a class="demo-btn" href="/demo/">Demo</a>

<header class="hero">
  <p class="welcome">Welcome to</p>
  <h1 class="title">Cindy's Speech Therapy!</h1>
</header>

<p class="subtitle">Choose a sound to practise</p>
<div class="cards">
  {#each WORD_GROUPS as group}
    {@const wordCount = Object.values(group.positions).flat().length}
    <LessonCard
      sound="/{group.sound.toUpperCase()}/"
      label="{wordCount} words"
      href="/activity/?sound={group.sound}"
    />
  {/each}
</div>

<StreakChart />

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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--color-surface);
    color: var(--color-on-surface);
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    padding: var(--space-8) var(--space-4);
  }

  @media (prefers-reduced-motion: reduce) {
    :global(*, *::before, *::after) {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-10);
  }

  .welcome {
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-on-surface-variant);
  }

  .title {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 2.25rem;
    font-weight: 700;
    line-height: 1.15;
    text-align: center;
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 400;
    color: var(--color-on-surface-variant);
    margin-bottom: var(--space-8);
    text-align: center;
  }

  .demo-btn {
    position: fixed;
    bottom: var(--space-6);
    right: var(--space-6);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-full);
    background: var(--color-surface-container);
    color: var(--color-on-surface-variant);
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    transition:
      background var(--duration-base) var(--ease-in-out),
      color     var(--duration-base) var(--ease-in-out),
      box-shadow var(--duration-base) var(--ease-in-out);
  }

  .demo-btn:hover {
    background: var(--color-surface-container-high);
    color: var(--color-on-surface);
    box-shadow: var(--shadow-ambient);
  }

  .cards {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-6);
    justify-content: center;
  }
</style>
