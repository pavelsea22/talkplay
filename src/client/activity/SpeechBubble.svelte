<script lang="ts">
  import { onMount } from 'svelte';

  let {
    cindyMood,
    illustration,
    showIllustration,
    feedbackHtml,
    feedbackClass,
  }: {
    cindyMood: string;
    illustration: string;
    showIllustration: boolean;
    feedbackHtml: string;
    feedbackClass: string;
  } = $props();

  let bubbleBgEl: HTMLImageElement;

  /**
   * Removes the white rectangular background from a speech bubble PNG using a
   * BFS flood-fill from the image border. Any light-coloured pixel reachable
   * from the edge (without crossing the dark bubble outline) is made fully
   * transparent, leaving the bubble interior white.
   */
  function removeBubbleBackground(img: HTMLImageElement): void {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width, h = canvas.height;

    const isLight = (x: number, y: number) => {
      const i = (y * w + x) * 4;
      return data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200;
    };

    // BFS flood-fill from all border pixels, making reachable light pixels transparent
    const visited = new Uint8Array(w * h);
    const queue: number[] = [];
    for (let x = 0; x < w; x++) { queue.push(x, 0); queue.push(x, h - 1); }
    for (let y = 1; y < h - 1; y++) { queue.push(0, y); queue.push(w - 1, y); }

    for (let qi = 0; qi < queue.length; qi += 2) {
      const x = queue[qi], y = queue[qi + 1];
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const idx = y * w + x;
      if (visited[idx] || !isLight(x, y)) continue;
      visited[idx] = 1;
      data[idx * 4 + 3] = 0;
      queue.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }

    ctx.putImageData(imageData, 0, 0);
    img.src = canvas.toDataURL();
  }

  onMount(() => {
    if (bubbleBgEl.complete) {
      removeBubbleBackground(bubbleBgEl);
    } else {
      bubbleBgEl.addEventListener("load", () => removeBubbleBackground(bubbleBgEl), { once: true });
    }
  });
</script>

<div class="cindy-area">
  <img class="cindy" src="/images/Cindy_{cindyMood}.png" alt="Cindy" />
  <div class="bubble-wrap">
    <img bind:this={bubbleBgEl} class="bubble-bg" src="/images/speech_bubble.png" alt="" />
    <div class="bubble-content">
      {#if showIllustration}
        <img class="word-illustration" src="/{illustration}" alt="" />
      {/if}
      <div class="feedback {feedbackClass}">{@html feedbackHtml}</div>
    </div>
  </div>
</div>

<style>
  .cindy-area {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 3rem;
    margin-bottom: 2rem;
  }

  .cindy {
    width: 200px;
    height: 200px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .bubble-wrap {
    position: relative;
    width: 280px;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bubble-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform: scaleX(-1);
  }

  .bubble-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0.5rem 1rem 2rem 2rem;
    width: 100%;
    height: 100%;
  }

  .word-illustration {
    width: 64px;
    height: 64px;
    object-fit: contain;
  }

  .feedback {
    font-size: 1.3rem;
    font-weight: 800;
    text-align: center;
    color: #1a1a2e;
    line-height: 1.2;
  }

  .feedback :global(strong) { color: #1a6ed8; }
  .feedback.correct { color: #15803d; }
  .feedback.incorrect { color: #b91c1c; }
</style>
