<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  // ── Grid constants ────────────────────────────────────────────────────────────
  /**
   * Viewport breakpoint (px) below which the maze flips to portrait orientation
   * (9 cols × 12 rows instead of 12 cols × 9 rows). Must match the CSS media
   * query in activity/App.svelte (.maze-card breakpoint).
   */
  const PORTRAIT_BREAKPOINT = 500;

  // COLS and ROWS are set in onMount after checking the viewport width.
  // Default values match the landscape (desktop) layout.
  let COLS = 12;
  let ROWS = 9;

  /** Cell interior size in pixels. */
  const CELL = 28;
  /** Wall / grid-line thickness in pixels. */
  const WALL = 2;
  /** Pixels from the start of one cell to the start of the next: CELL + WALL. */
  const STEP = CELL + WALL; // 30

  /**
   * Canvas pixel dimensions — computed in onMount once COLS/ROWS are known.
   *   Landscape (12×9):  CW = 12×30+2 = 362,  CH = 9×30+2  = 272
   *   Portrait  (9×12):  CW = 9×30+2  = 272,  CH = 12×30+2 = 362
   */
  let CW = 0;
  let CH = 0;

  // ── Types ─────────────────────────────────────────────────────────────────────
  type Direction = 'up' | 'right' | 'down' | 'left';

  interface MazeCell {
    /** Presence of wall on each side. Index: 0=top, 1=right, 2=bottom, 3=left. */
    walls: [boolean, boolean, boolean, boolean];
  }

  // ── Directional look-up tables ────────────────────────────────────────────────
  const DIR_DELTA: Record<Direction, [number, number]> = {
    up:    [0, -1],
    right: [1,  0],
    down:  [0,  1],
    left:  [-1, 0],
  };

  const DIR_IDX: Record<Direction, 0 | 1 | 2 | 3> = {
    up: 0, right: 1, down: 2, left: 3,
  };

  const OPPOSITE: Record<Direction, Direction> = {
    up: 'down', right: 'left', down: 'up', left: 'right',
  };

  // ── Colour palette ────────────────────────────────────────────────────────────
  const C = {
    wall:  '#1e293b', // dark blue-grey for walls
    path:  '#f0e8d8', // warm cream for open corridors
    start: '#d1fae5', // soft green for the start cell
    exit:  '#f0e8d8', // same cream — flag pattern fills the cell
  } as const;

  // ── DOM reference ─────────────────────────────────────────────────────────────
  let canvas: HTMLCanvasElement;

  // ── Reactive state (visible in template) ──────────────────────────────────────
  let steps = $state(0);
  let won   = $state(false);

  // ── Internal state (imperative, not bound to template) ────────────────────────
  let maze: MazeCell[][] = [];
  let bunnyX = 0;
  let bunnyY = 0;
  let winTimeout: ReturnType<typeof setTimeout> | undefined;

  // ── Maze generation ───────────────────────────────────────────────────────────

  /**
   * Generates a random perfect maze using the iterative recursive-backtracker
   * (DFS) algorithm. Every cell is reachable and there is exactly one path
   * between any two cells.
   *
   * @returns A ROWS×COLS grid of cells with their wall bitmask set.
   */
  function generateMaze(): MazeCell[][] {
    const grid: MazeCell[][] = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({
        walls: [true, true, true, true] as [boolean, boolean, boolean, boolean],
      }))
    );

    const visited = Array.from({ length: ROWS }, () =>
      new Array<boolean>(COLS).fill(false)
    );

    const stack: [number, number][] = [[0, 0]];
    visited[0][0] = true;

    const dirs: Direction[] = ['up', 'right', 'down', 'left'];

    while (stack.length > 0) {
      const [cx, cy] = stack[stack.length - 1];
      const neighbors: [Direction, number, number][] = [];

      for (const dir of dirs) {
        const [dx, dy] = DIR_DELTA[dir];
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !visited[ny][nx]) {
          neighbors.push([dir, nx, ny]);
        }
      }

      if (neighbors.length > 0) {
        const [dir, nx, ny] =
          neighbors[Math.floor(Math.random() * neighbors.length)];
        // Carve passage in both cells
        grid[cy][cx].walls[DIR_IDX[dir]] = false;
        grid[ny][nx].walls[DIR_IDX[OPPOSITE[dir]]] = false;
        visited[ny][nx] = true;
        stack.push([nx, ny]);
      } else {
        stack.pop();
      }
    }

    return grid;
  }

  // ── Rendering ─────────────────────────────────────────────────────────────────

  /**
   * Returns the top-left canvas pixel coordinate for the interior of the
   * given grid cell.
   */
  function cellPixel(col: number, row: number): [number, number] {
    return [col * STEP + WALL, row * STEP + WALL];
  }

  /**
   * Draws the 🐰 emoji centred in the given cell.
   *
   * @param ctx  2D rendering context.
   * @param col  Bunny column in the maze grid.
   * @param row  Bunny row in the maze grid.
   */
  function drawBunny(ctx: CanvasRenderingContext2D, col: number, row: number): void {
    const [px, py] = cellPixel(col, row);
    ctx.save();
    ctx.font = `${CELL + 2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // +1 px vertical nudge compensates for typical emoji descender offset.
    ctx.fillText('🐰', px + CELL / 2, py + CELL / 2 + 1);
    ctx.restore();
  }

  /**
   * Draws a hand-rendered checkered finish-flag pattern filling the exit cell.
   * CELL (28) ÷ 4 = 7 squares per axis → 7×7 grid of 4×4 px checker squares.
   *
   * @param ctx  2D rendering context.
   * @param col  Exit column in the maze grid.
   * @param row  Exit row in the maze grid.
   */
  function drawFinishFlag(ctx: CanvasRenderingContext2D, col: number, row: number): void {
    const [px, py] = cellPixel(col, row);
    const sq = 4;               // each checker square is 4 px
    const n  = CELL / sq;       // 7 squares per axis

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#111111' : '#f5f5f5';
        ctx.fillRect(px + c * sq, py + r * sq, sq, sq);
      }
    }
  }

  /** Redraws the entire maze and bunny. Called after every state change. */
  function render(): void {
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Walls fill everything; cells are punched out on top.
    ctx.fillStyle = C.wall;
    ctx.fillRect(0, 0, CW, CH);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const [px, py] = cellPixel(col, row);

        // Cell background (exit cell gets a plain fill first; flag is drawn later)
        ctx.fillStyle = col === 0 && row === 0 ? C.start : C.path;
        ctx.fillRect(px, py, CELL, CELL);

        const cell = maze[row][col];

        // Open right passage (pixel column between this cell and the next)
        if (!cell.walls[1] && col < COLS - 1) {
          ctx.fillStyle = C.path;
          ctx.fillRect(px + CELL, py, WALL, CELL);
        }
        // Open bottom passage (pixel row between this cell and the one below)
        if (!cell.walls[2] && row < ROWS - 1) {
          ctx.fillStyle = C.path;
          ctx.fillRect(px, py + CELL, CELL, WALL);
        }
      }
    }

    // Checkered finish flag drawn on top of the exit cell's plain background.
    drawFinishFlag(ctx, COLS - 1, ROWS - 1);

    drawBunny(ctx, bunnyX, bunnyY);
  }

  // ── Movement ──────────────────────────────────────────────────────────────────

  /**
   * Attempts to move the bunny one cell in the given direction.
   * Movement is blocked if the wall on that side is intact.
   * Reaching the exit cell triggers the win state.
   *
   * @param dir  The direction to move.
   */
  function move(dir: Direction): void {
    if (won) return;

    const cell = maze[bunnyY][bunnyX];

    if (!cell.walls[DIR_IDX[dir]]) {
      const [dx, dy] = DIR_DELTA[dir];
      bunnyX += dx;
      bunnyY += dy;
      steps++;

      if (bunnyX === COLS - 1 && bunnyY === ROWS - 1) {
        won = true;
        render();
        // Auto-close after the celebration is shown
        winTimeout = setTimeout(onClose, 2500);
        return;
      }
    }

    render();
  }

  /**
   * Keyboard handler — maps arrow keys and WASD to directional moves.
   * Swallows the event to prevent page scrolling while playing.
   */
  function handleKey(e: KeyboardEvent): void {
    const MAP: Partial<Record<string, Direction>> = {
      ArrowUp:    'up',   ArrowDown:  'down',
      ArrowLeft:  'left', ArrowRight: 'right',
      w: 'up',  s: 'down',  a: 'left',  d: 'right',
      W: 'up',  S: 'down',  A: 'left',  D: 'right',
    };
    const dir = MAP[e.key];
    if (dir) {
      e.preventDefault();
      move(dir);
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────────
  onMount(() => {
    // Portrait viewports (phones) get a taller-than-wide maze so it fills the
    // screen more naturally. The same 12×9 cell count is used in both layouts,
    // just with the axes swapped.
    const portrait = window.innerWidth < PORTRAIT_BREAKPOINT;
    COLS = portrait ? 9  : 12;
    ROWS = portrait ? 12 : 9;
    CW   = COLS * STEP + WALL;
    CH   = ROWS * STEP + WALL;

    // Set canvas buffer size and CSS max-width imperatively — this avoids
    // Svelte reactive-attribute timing issues and keeps CW/CH non-reactive.
    canvas.width  = CW;
    canvas.height = CH;
    canvas.style.maxWidth = `${CW}px`;

    maze = generateMaze();
    render();
    window.addEventListener('keydown', handleKey);
  });

  onDestroy(() => {
    clearTimeout(winTimeout);
    window.removeEventListener('keydown', handleKey);
  });
</script>

<div class="game">
  <div class="header">
    <span class="steps">{steps} step{steps !== 1 ? 's' : ''}</span>
  </div>

  <div class="canvas-wrap">
    <canvas bind:this={canvas}></canvas>

    {#if won}
      <div class="win-overlay">
        <span class="win-emoji">🎉</span>
        <p class="win-text">You made it!</p>
        <p class="win-steps">{steps} steps</p>
        <button
          class="win-btn"
          onclick={() => { clearTimeout(winTimeout); onClose(); }}
        >
          Close
        </button>
      </div>
    {/if}
  </div>

  {#if !won}
    <div class="dpad" aria-label="Directional controls">
      <div class="dpad-row dpad-row--center">
        <button class="dpad-btn" onclick={() => move('up')} aria-label="Move up">▲</button>
      </div>
      <div class="dpad-row">
        <button class="dpad-btn" onclick={() => move('left')}  aria-label="Move left">◀</button>
        <button class="dpad-btn" onclick={() => move('down')}  aria-label="Move down">▼</button>
        <button class="dpad-btn" onclick={() => move('right')} aria-label="Move right">▶</button>
      </div>
    </div>

    <button class="close-btn" onclick={onClose}>Close</button>
  {/if}
</div>

<style>
  .game {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: var(--space-3);
  }

  /* ── Header ── */
  .header {
    display: flex;
    justify-content: center;
  }

  .steps {
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-on-surface-variant);
  }

  /* ── Canvas ── */
  .canvas-wrap {
    position: relative;
    border-radius: var(--radius-sm);
    overflow: hidden;
    line-height: 0; /* removes gap below inline canvas */
  }

  canvas {
    display: block;
    /* Scale to fill the card's inner width while preserving pixel sharpness.
       height: auto preserves the intrinsic 301:201 aspect ratio. */
    width: 100%;
    height: auto;
    image-rendering: pixelated;
  }

  /* ── Win overlay ── */
  .win-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    background: rgba(255, 253, 235, 0.92);
    backdrop-filter: blur(2px);
    border-radius: var(--radius-sm);
  }

  .win-emoji {
    font-size: 2.5rem;
    line-height: 1;
  }

  .win-text {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-on-surface);
    margin: 0;
  }

  .win-steps {
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 0.875rem;
    color: var(--color-on-surface-variant);
    margin: 0;
  }

  .win-btn {
    margin-top: var(--space-2);
    padding: var(--space-2) var(--space-6);
    border: none;
    border-radius: var(--radius-full);
    background: var(--color-primary);
    color: white;
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity var(--duration-fast) var(--ease-in-out);
  }

  .win-btn:hover { opacity: 0.85; }

  /* ── D-pad ── */
  .dpad {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
  }

  .dpad-row {
    display: flex;
    gap: var(--space-1);
  }

  .dpad-row--center {
    justify-content: center;
  }

  .dpad-btn {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: var(--radius-md);
    background: var(--color-surface-container);
    color: var(--color-on-surface);
    font-size: 1.125rem;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    transition:
      background  var(--duration-fast) var(--ease-in-out),
      transform   var(--duration-fast) var(--ease-in-out);
  }

  .dpad-btn:hover  { background: var(--color-surface-container-high); }
  .dpad-btn:active { transform: scale(0.9); }

  /* ── Close button ── */
  .close-btn {
    display: block;
    margin: 0 auto;
    padding: var(--space-2) var(--space-8);
    border: none;
    border-radius: var(--radius-full);
    background: var(--color-surface-container);
    color: var(--color-on-surface-variant);
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background var(--duration-base) var(--ease-in-out);
  }

  .close-btn:hover { background: var(--color-surface-container-high); }
</style>
