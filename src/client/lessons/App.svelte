<script lang="ts">
  import { WORD_GROUPS, getActiveWords } from '../../words';
  import LessonCard from './LessonCard.svelte';
  import StreakChart from './StreakChart.svelte';

  const wordCount = getActiveWords().length;
</script>

<header class="hero">
  <p class="welcome">Welcome to</p>
  <h1 class="title">Cindy's Speech Therapy!</h1>
</header>

<p class="subtitle">Choose a sound to practise</p>
<div class="cards">
  {#each WORD_GROUPS as group}
    <LessonCard
      sound="/{group.sound.toUpperCase()}/"
      label="{wordCount} words"
      href="/activity"
    />
  {/each}
</div>

<StreakChart />

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }

  :global(body) {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #0f0f13;
    color: #f0f0f0;
    font-family: 'Baloo 2', system-ui, sans-serif;
    padding: 2rem 1rem;
  }

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 2.5rem;
  }

  .welcome {
    font-size: 1.6rem;
    font-weight: 600;
    background: linear-gradient(90deg, #ff6b6b, #ff9f43, #ffd93d, #6bcb77, #4d96ff, #c77dff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .title {
    font-size: 3rem;
    font-weight: 800;
    line-height: 1.1;
    text-align: center;
    background: linear-gradient(90deg, #ff6b6b, #ff9f43, #ffd93d, #6bcb77, #4d96ff, #c77dff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    font-size: 1.2rem;
    color: #9ca3af;
    margin-bottom: 2.5rem;
    text-align: center;
  }

  .cards {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    justify-content: center;
  }
</style>
