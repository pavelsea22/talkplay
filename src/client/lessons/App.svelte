<script lang="ts">
  import { WORD_GROUPS } from '../../words';
  import LessonCard from './LessonCard.svelte';
  import StreakChart from './StreakChart.svelte';
  import { getTodayStatus } from '../lessonState';

  // Read once at script-eval time. The home screen is full-page, so any
  // change to this state is observed naturally on the next visit.
  const todayStatus = getTodayStatus();
</script>

<a class="parent-link" href="/parent/">Parent Portal</a>
<a class="demo-btn" href="/demo/">Demo</a>

<header class="hero">
  <p class="welcome">Welcome to</p>
  <h1 class="title">Cindy's Speech Therapy!</h1>
</header>

{#if todayStatus === 'completed'}
  <a class="done-link" href="/activity/?mode=more">
    Today's lesson complete! But you can do more practice if you want
  </a>
{:else}
  <a class="today-cta" href="/activity/?mode=today">
    {todayStatus === 'in_progress' ? "Complete Today's Lesson" : "Today's Lesson"}
  </a>
{/if}

<section class="free-practice">
  <h2 class="section-heading">Free Practice</h2>
  <p class="subtitle">Pick any sound</p>
  <div class="cards">
    {#each WORD_GROUPS as group (group.sound)}
      {@const wordCount = Object.values(group.positions).flat().length}
      <LessonCard
        sound="/{group.sound.toUpperCase()}/"
        label="{wordCount} words"
        href="/activity/?sound={group.sound}"
      />
    {/each}
  </div>
</section>

<StreakChart />

<style>
  /* Tokens (colors, spacing, radii, motion) are in src/client/tokens.css,
     imported by main.ts. Only page-specific layout lives here. */

  :global(body) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-8) var(--space-4);
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

  .parent-link {
    position: fixed;
    bottom: var(--space-6);
    left: var(--space-6);
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
  .parent-link:hover {
    background: var(--color-surface-container-high);
    color: var(--color-on-surface);
    box-shadow: var(--shadow-ambient);
  }

  .today-cta {
    display: block;
    width: 100%;
    max-width: 28rem;
    margin: 0 auto var(--space-12);
    padding: var(--space-8) var(--space-6);
    border-radius: var(--radius-xl);
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
    color: var(--color-on-primary);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.75rem;
    font-weight: 800;
    text-align: center;
    text-decoration: none;
    box-shadow: 0 16px 32px rgba(0, 98, 134, 0.25);
    transition: transform var(--duration-base) var(--ease-out-soft),
                box-shadow var(--duration-base) var(--ease-out-soft);
  }
  .today-cta:hover {
    transform: translateY(-3px);
    box-shadow: 0 22px 40px rgba(0, 98, 134, 0.35);
  }
  .today-cta:active {
    transform: translateY(0);
  }

  .done-link {
    display: block;
    max-width: 28rem;
    margin: 0 auto var(--space-12);
    padding: var(--space-4) var(--space-6);
    border-radius: var(--radius-lg);
    background: var(--color-secondary-container);
    color: var(--color-on-secondary-container);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.125rem;
    font-weight: 700;
    text-align: center;
    text-decoration: none;
    transition: background var(--duration-base) var(--ease-in-out);
  }
  .done-link:hover {
    background: #b3e8a0;
  }

  .free-practice {
    width: 100%;
    max-width: 60rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: var(--space-10);
  }
  .section-heading {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-on-surface);
    margin-bottom: var(--space-2);
  }
</style>
