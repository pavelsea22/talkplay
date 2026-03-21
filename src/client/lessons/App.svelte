<script lang="ts">
  import { WORD_GROUPS, getActiveWords } from '../../words';
  import LessonCard from './LessonCard.svelte';

  const wordCount = getActiveWords().length;
</script>

<h1>TalkPlay</h1>
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
  }

  h1 {
    position: fixed;
    top: 1.2rem;
    right: 1.5rem;
    font-size: 1.6rem;
    font-weight: 800;
    color: #fff;
  }

  .subtitle {
    font-size: 1.2rem;
    color: #9ca3af;
    margin-bottom: 2.5rem;
  }

  .cards {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    justify-content: center;
  }
</style>
