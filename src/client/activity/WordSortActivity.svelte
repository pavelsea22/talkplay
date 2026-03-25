<script lang="ts">
  import { evaluateWordSort } from '../../tasks/wordSort/evaluator';
  import type { WordSortTask } from '../../tasks/wordSort';

  interface Props {
    task: WordSortTask;
    onComplete: (result: any) => void;
  }

  let { task, onComplete }: Props = $props();

  let remaining = $state<string[]>([...task.words]);
  let placed = $state<Record<string, 0 | 1>>({});
  let locked = $state(false);
  let dragging = $state<string | null>(null);
  let dragOffset = $state({ x: 0, y: 0 });
  let dragImageRect = $state<DOMRect | null>(null);
  let hoveredBucket = $state<0 | 1 | null>(null);
  let hoverIsCorrect = $state(false);

  const BUCKET_COUNT = 2;

  /**
   * Handle drop onto a bucket.
   */
  function handleDrop(word: string, bucketIndex: 0 | 1) {
    if (locked || placed[word] !== undefined) return;

    const result = evaluateWordSort(word, bucketIndex, task);

    if (result === 'correct') {
      placed[word] = bucketIndex;
      remaining = remaining.filter((w) => w !== word);
      dragging = null;

      // Check if all words are placed
      if (remaining.length === 0) {
        onComplete({ type: 'wordSort', correct: true });
      }
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
    {#each remaining as word (word)}
      <div
        class="word-card"
        class:dragging={dragging === word}
        draggable={!locked}
        ondragstart={(e) => onDragStart(e, word)}
        ontouchstart={(e) => onTouchStart(e, word)}
        ontouchend={(e) => onTouchEnd(e, word)}
      >
        {word}
      </div>
    {/each}
  </div>

  <!-- Buckets -->
  <div class="buckets">
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
          {#each remaining as word (word)}
            {#if placed[word] === bucketIndex}
              <div class="placed-word">{word}</div>
            {/if}
          {/each}
          {#each Object.entries(placed) as [word, idx] (word)}
            {#if idx === bucketIndex}
              <div class="placed-word">{word}</div>
            {/if}
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .word-sort-activity {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
  }

  .header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
  }

  .word-pool {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .word-card {
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px;
    cursor: grab;
    text-align: center;
    font-weight: 600;
    font-size: 1.1rem;
    touch-action: none;
    user-select: none;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .word-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .word-card.dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  .buckets {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .bucket {
    padding: 1.5rem;
    background: #f5f5f5;
    border: 2px dashed #ccc;
    border-radius: 8px;
    min-height: 150px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: background-color 0.15s, border-color 0.15s, box-shadow 0.15s;
  }

  .bucket.hovering {
    background-color: #f0f0f0;
  }

  .bucket.correct {
    background-color: #dcfce7;
    border-color: #22c55e;
    box-shadow: inset 0 0 12px rgba(34, 197, 94, 0.2);
  }

  .bucket.incorrect {
    background-color: #fee2e2;
    border-color: #ef4444;
    box-shadow: inset 0 0 12px rgba(239, 68, 68, 0.2);
  }

  .bucket-label {
    font-weight: 600;
    color: #555;
    text-align: center;
  }

  .bucket-contents {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  .placed-word {
    padding: 0.6rem 1rem;
    background: white;
    border-radius: 4px;
    font-size: 0.9rem;
    color: #333;
    animation: slideIn 0.3s ease-in;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes shake {
    0%, 100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-5px);
    }
    75% {
      transform: translateX(5px);
    }
  }
</style>
