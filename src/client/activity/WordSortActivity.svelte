<script lang="ts">
  import { evaluateWordSort } from '../../tasks/wordSort/evaluator';
  import type { WordSortTask } from '../../tasks/wordSort';
  import { speakWord } from './audio';

  interface Props {
    task: WordSortTask;
    onComplete: (result: any) => void;
  }

  let { task, onComplete }: Props = $props();

  let placed = $state<Record<string, 0 | 1>>({});
  let allPlaced = $derived(Object.keys(placed).length === task.words.length);
  let locked = $state(false);
  let dragging = $state<string | null>(null);
  let dragOffset = $state({ x: 0, y: 0 });
  let dragImageRect = $state<DOMRect | null>(null);
  let hoveredBucket = $state<0 | 1 | null>(null);
  let hoverIsCorrect = $state(false);
  let justDraggedWord = $state<string | null>(null);

  const BUCKET_COUNT = 2;

  /**
   * Handle drop onto a bucket.
   */
  function handleDrop(word: string, bucketIndex: 0 | 1) {
    if (locked || placed[word] !== undefined) return;

    const result = evaluateWordSort(word, bucketIndex, task);

    if (result === 'correct') {
      placed[word] = bucketIndex;
      dragging = null;
      speakWord(word, { raw: true });

    } else {
      // Reject animation
      locked = true;
      setTimeout(() => {
        dragging = null;
        locked = false;
      }, 400);
    }
  }

  /**
   * Drag start (mouse).
   */
  function onDragStart(e: DragEvent, word: string) {
    dragging = word;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', word);
    }
  }

  /**
   * Drag end (mouse) — clears dragging state if drop was outside any bucket.
   */
  function onDragEnd(word: string) {
    // If dragging is still set, the drop didn't land in a bucket, so clear it
    justDraggedWord = word;
    dragging = null;
    hoveredBucket = null;
    hoverIsCorrect = false;
  }

  /**
   * Mouse leave card — clear the "just dragged" flag so hover can re-enable.
   */
  function onMouseLeaveCard() {
    justDraggedWord = null;
  }

  /**
   * Drag over bucket (mouse).
   */
  function onDragOver(e: DragEvent, bucketIndex: 0 | 1) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dragging) {
      hoveredBucket = bucketIndex;
      hoverIsCorrect = evaluateWordSort(dragging, bucketIndex, task) === 'correct';
    }
  }

  /**
   * Drag leave bucket.
   */
  function onDragLeave() {
    hoveredBucket = null;
    hoverIsCorrect = false;
  }

  /**
   * Drop onto bucket (mouse).
   */
  function onDropOnBucket(e: DragEvent, bucketIndex: 0 | 1) {
    e.preventDefault();
    const word = e.dataTransfer?.getData('text/plain');
    if (word) {
      handleDrop(word, bucketIndex);
    }
    hoveredBucket = null;
    hoverIsCorrect = false;
  }

  /**
   * Touch start.
   */
  function onTouchStart(e: TouchEvent, word: string) {
    if (placed[word] !== undefined || locked) return;
    dragging = word;
    const touch = e.touches[0];
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    dragOffset = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  /**
   * Touch move.
   */
  function onTouchMove(e: TouchEvent, word: string) {
    if (dragging !== word || locked) return;
    // Touch movement is handled by CSS transform updates in the template
  }

  /**
   * Touch end.
   */
  function onTouchEnd(e: TouchEvent, word: string) {
    if (dragging !== word || locked) return;

    const touch = e.changedTouches[0];
    const buckets = document.querySelectorAll('[data-bucket]');

    for (const bucket of buckets) {
      const rect = bucket.getBoundingClientRect();
      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        const bucketIndex = parseInt(bucket.getAttribute('data-bucket') || '0', 10) as 0 | 1;
        handleDrop(word, bucketIndex);
        return;
      }
    }

    dragging = null;
  }
</script>

<div class="word-sort-activity">
  <div class="header">
    <h2>Sort the words into the buckets</h2>
  </div>

  <!-- Word Pool -->
  <div class="word-pool">
    {#each task.words as word (word)}
      <div
        class="word-card"
        class:placed={placed[word] !== undefined}
        class:dragging={dragging === word}
        class:skip-hover={justDraggedWord === word}
        draggable={!locked && placed[word] === undefined}
        ondragstart={(e) => onDragStart(e, word)}
        ondragend={() => onDragEnd(word)}
        onmouseleave={onMouseLeaveCard}
        ontouchstart={(e) => onTouchStart(e, word)}
        ontouchend={(e) => onTouchEnd(e, word)}
      >
        {word}
      </div>
    {/each}
  </div>

  <!-- Buckets -->
  <div class="buckets" class:all-placed={allPlaced}>
    {#each [0, 1] as bucketIndex}
      <div
        class="bucket"
        class:hovering={hoveredBucket === bucketIndex}
        class:correct={hoveredBucket === bucketIndex && hoverIsCorrect}
        class:incorrect={hoveredBucket === bucketIndex && !hoverIsCorrect}
        data-bucket={bucketIndex}
        ondragover={(e) => onDragOver(e, bucketIndex as 0 | 1)}
        ondragleave={onDragLeave}
        ondrop={(e) => onDropOnBucket(e, bucketIndex as 0 | 1)}
      >
        <div class="bucket-label">{task.buckets[bucketIndex]}</div>
        <div class="bucket-contents">
          {#each task.words as word (word)}
            {#if placed[word] === bucketIndex}
              <div class="placed-word">{word}</div>
            {/if}
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#if allPlaced}
    <button class="next-btn" onclick={() => onComplete({ type: 'wordSort', correct: true })}>
      Next →
    </button>
  {/if}
</div>

<style>
  .word-sort-activity {
    padding: var(--space-8);
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    max-width: 560px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
  }

  .header h2 {
    margin: 0;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.375rem;
    font-weight: 600;
    color: var(--color-on-surface-variant);
  }

  .word-pool {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }

  .word-card {
    padding: var(--space-4);
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
    color: var(--color-on-primary);
    border-radius: var(--radius-lg);
    cursor: grab;
    text-align: center;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-weight: 700;
    font-size: 1.125rem;
    touch-action: none;
    user-select: none;
    box-shadow: var(--shadow-ambient);
    transition:
      transform   var(--duration-base) var(--ease-out-soft),
      box-shadow  var(--duration-base) var(--ease-in-out),
      opacity     var(--duration-base) var(--ease-in-out);
  }

  .word-card.placed {
    visibility: hidden;
  }

  .word-card:hover:not(.dragging):not(.skip-hover):not(.placed) {
    transform: translateY(-3px);
    box-shadow: 0 16px 40px rgba(4, 50, 76, 0.12);
  }

  .word-card.dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  .buckets {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }

  .bucket {
    padding: var(--space-6);
    background: var(--color-surface-container-low);
    border-radius: var(--radius-xl);
    outline: 1px solid rgba(141, 177, 209, 0.15);
    min-height: 150px;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    transition:
      background var(--duration-base) var(--ease-in-out),
      box-shadow  var(--duration-base) var(--ease-in-out);
  }

  .bucket.hovering {
    background: var(--color-surface-container);
  }

  .bucket.correct {
    background: var(--color-secondary-container);
  }

  .bucket.incorrect {
    background: #fecaca;
  }

  .bucket-label {
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-on-surface-variant);
    text-align: center;
  }

  .bucket-contents {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex: 1;
  }

  .placed-word {
    padding: var(--space-2) var(--space-4);
    background: var(--color-surface-container-lowest);
    border-radius: var(--radius-full);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-on-surface);
    text-align: center;
    animation: slideIn var(--duration-slow) var(--ease-out-soft);
  }

  .next-btn {
    align-self: center;
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
      opacity   var(--duration-fast) var(--ease-in-out),
      transform var(--duration-fast) var(--ease-in-out);
  }

  .next-btn:hover  { opacity: 0.9; }
  .next-btn:active { transform: scale(0.95); }

  @keyframes slideIn {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25%       { transform: translateX(-5px); }
    75%       { transform: translateX(5px); }
  }
</style>
