<script lang="ts">
  import { onDestroy } from 'svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  type Balloon = {
    id: number;
    x: number;       // left position as % of arena width
    color: string;
    size: number;    // diameter in px
    duration: number; // float animation duration in seconds
    popped: boolean;
  };

  const COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#c084fc', '#f472b6'];

  let balloons = $state<Balloon[]>([]);
  let score = $state(0);
  let nextId = 0;

  function spawn(): void {
    const duration = 4 + Math.random() * 3;
    const id = nextId++;
    balloons = [...balloons, {
      id,
      x: 5 + Math.random() * 75,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 44 + Math.random() * 26,
      duration,
      popped: false,
    }];
    // Remove the balloon once its float animation has had time to complete.
    // This is more reliable than animationend, which can be suppressed by DOM updates.
    setTimeout(() => { balloons = balloons.filter(b => b.id !== id); }, duration * 1000 + 300);
  }

  /** Marks a balloon as popped (triggers pop animation), then removes it. */
  function pop(id: number): void {
    balloons = balloons.map(b => b.id === id ? { ...b, popped: true } : b);
    score++;
    setTimeout(() => { balloons = balloons.filter(b => b.id !== id); }, 350);
  }

  // Stagger the initial balloons so they don't all launch at once.
  spawn();
  setTimeout(spawn, 500);
  setTimeout(spawn, 1000);
  const spawnInterval = setInterval(spawn, 1400);

  onDestroy(() => clearInterval(spawnInterval));
</script>

<div class="game">
  <div class="score">{score} popped</div>

  <div class="arena">
    {#each balloons as b (b.id)}
      <button
        class="balloon {b.popped ? 'popped' : ''}"
        style="left: {b.x}%; --size: {b.size}px; --dur: {b.duration}s;"
        onclick={() => !b.popped && pop(b.id)}
        aria-label="Pop balloon"
      >
        <svg viewBox="0 0 50 80" width={b.size} height={b.size * 1.6} style="display:block;">
          <!-- balloon body -->
          <ellipse cx="25" cy="24" rx="21" ry="22" fill={b.color}/>
          <!-- glossy highlight -->
          <ellipse cx="17" cy="14" rx="6" ry="5" fill="rgba(255,255,255,0.28)"/>
          <!-- knot at bottom of balloon -->
          <polygon points="22,46 28,46 25,53" fill={b.color}/>
          <!-- string -->
          <path d="M25 53 Q19 63 25 73" stroke="#9ca3af" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        </svg>
      </button>
    {/each}
  </div>

  <button class="close-btn" onclick={onClose}>Close</button>
</div>

<style>
  .game {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .score {
    font-size: 1.2rem;
    font-weight: 700;
    text-align: center;
    padding: 0.4rem 0 0.6rem;
    color: #f0f0f0;
  }

  .arena {
    flex: 1;
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    background: linear-gradient(to top, #0f172a, #1e293b);
  }

  .balloon {
    position: absolute;
    bottom: -90px; /* start just below the visible area */
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transform-origin: center bottom;
    animation: float-up var(--dur) linear forwards;
  }

  .balloon.popped {
    animation: pop 0.35s ease forwards;
    pointer-events: none;
  }

  @keyframes float-up {
    0%   { transform: translateY(0)    rotate(-4deg); }
    25%  { transform: translateY(-150px) rotate(4deg); }
    50%  { transform: translateY(-300px) rotate(-4deg); }
    75%  { transform: translateY(-450px) rotate(4deg); }
    100% { transform: translateY(-650px) rotate(0deg); }
  }

  @keyframes pop {
    0%   { transform: scale(1);   opacity: 1; }
    40%  { transform: scale(1.6); opacity: 0.6; }
    100% { transform: scale(0.1); opacity: 0; }
  }

  .close-btn {
    display: block;
    margin: 0.7rem auto 0;
    padding: 0.5rem 2.2rem;
    border: none;
    border-radius: 12px;
    background: #374151;
    color: #f0f0f0;
    font-family: 'Baloo 2', system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
  }

  .close-btn:hover { background: #4b5563; }
</style>
