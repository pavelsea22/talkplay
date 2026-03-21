<script lang="ts">
  /** One pill per word: pending (not yet attempted), correct (answered right), failed (3 wrong tries). */
  export type WordStatus = 'pending' | 'correct' | 'failed';

  interface Props {
    /** Status of each word in the lesson, in order. */
    statuses: WordStatus[];
    /** Index of the word currently being practiced (highlighted slightly). */
    currentIndex: number;
  }

  let { statuses, currentIndex }: Props = $props();
</script>

<div class="progress-bar">
  {#each statuses as status, i}
    <div class="segment {status} {i === currentIndex ? 'current' : ''}"></div>
  {/each}
</div>

<style>
  .progress-bar {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
  }

  .segment {
    width: 48px;
    height: 14px;
    border-radius: 4px;
    border: 3px solid white;
    transition: background 0.3s;
  }

  .segment.pending {
    background: #4b5563;
  }

  .segment.pending.current {
    background: #6b7280;
  }

  .segment.correct {
    background: #4ade80;
  }

  .segment.failed {
    background: #f87171;
  }
</style>
