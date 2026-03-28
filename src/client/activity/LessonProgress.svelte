<script lang="ts">
  import type { TaskStatus } from '../../tasks';

  interface Props {
    /** Status of each task in the lesson, in order. */
    statuses: TaskStatus[];
    /** Index of the task currently being practiced (highlighted slightly). */
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
    gap: var(--space-2);
    align-items: center;
    justify-content: center;
  }

  .segment {
    width: 48px;
    height: 10px;
    border-radius: var(--radius-full);
    transition: background var(--duration-base) var(--ease-in-out);
    background: var(--color-surface-container-high);
  }

  .segment.pending.current {
    background: var(--color-surface-dim);
  }

  .segment.passed {
    background: var(--color-secondary-container);
  }

  .segment.failed {
    background: #fca5a5;
  }
</style>
