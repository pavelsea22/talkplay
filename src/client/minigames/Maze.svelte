<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  // ── Grid constants ────────────────────────────────────────────────────────────
  const COLS = 18;
  const ROWS = 12;
  /** Cell interior size in pixels (canvas resolution, not CSS display size). */
  const CELL = 18;
  /** Wall / grid-line thickness in pixels. */
  const WALL = 2;
  /** Pixels from the start of one cell to the start of the next. */
  const STEP = CELL + WALL; // 20
  /** Total canvas width in pixels: COLS cells + (COLS+1) wall lines. */
  const CW = COLS * STEP + WALL; // 362
  /** Total canvas height in pixels: ROWS cells + (ROWS+1) wall lines. */
  const CH = ROWS * STEP + WALL; // 242

  // ── Sprite scaling ────────────────────────────────────────────────────────────
  /** Pixel dimensions of the source sprite grid. */
  const SPRITE_SIZE = 9;
  /**
   * Each sprite pixel is rendered as a SPRITE_SCALE×SPRITE_SCALE block so the
   * bunny fills the larger cell without redrawing the sprite data.
   * CELL / SPRITE_SIZE = 18 / 9 = 2.
   */
  const SPRITE_SCALE = CELL / SPRITE_SIZE; // 2

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

  // ── 9×9 pixel-art bunny sprites ───────────────────────────────────────────────
  // Bunny is viewed from directly above.
  // Head points in the movement direction; ears flank the head.
  //   0 = transparent (shows cell background)
  //   1 = fur (cream)
  //   2 = ear (pink)
  //   3 = eye (dark)
  type PixVal = 0 | 1 | 2 | 3;
  type Sprite = ReadonlyArray<ReadonlyArray<PixVal>>;

  const SPRITES: Record<Direction, Sprite> = {
    /** Head at top, ears flank the top of the body. */
    up: [
      [0, 2, 0, 0, 0, 0, 2, 0, 0],
      [0, 2, 0, 0, 0, 0, 2, 0, 0],
      [0, 2, 1, 1, 1, 1, 2, 0, 0],
      [0, 1, 1, 3, 1, 3, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    /** Head at bottom, ears flank the bottom of the body. */
    down: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 3, 1, 3, 1, 1, 0],
      [0, 2, 1, 1, 1, 1, 1, 2, 0],
      [0, 2, 0, 0, 0, 0, 0, 2, 0],
      [0, 2, 0, 0, 0, 0, 0, 2, 0],
    ],
    /** Head on right, ears flank the right side of the body; single eye facing right. */
    right: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 2, 2, 0],
      [0, 0, 0, 1, 1, 1, 1, 2, 0],
      [0, 0, 1, 1, 1, 1, 1, 2, 0],
      [0, 1, 1, 1, 1, 1, 3, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 2, 0],
      [0, 0, 0, 1, 1, 1, 1, 2, 0],
      [0, 0, 0, 0, 0, 0, 2, 2, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    /** Head on left, ears flank the left side of the body; single eye facing left. */
    left: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 2, 2, 0, 0, 0, 0, 0, 0],
      [0, 2, 1, 1, 1, 1, 0, 0, 0],
      [0, 2, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 3, 1, 1, 1, 1, 1, 0],
      [0, 2, 1, 1, 1, 1, 1, 0, 0],
      [0, 2, 1, 1, 1, 1, 0, 0, 0],
      [0, 2, 2, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  };

  // ── Colour palette ────────────────────────────────────────────────────────────
  const C = {
    wall:   '#1e293b', // dark blue-grey for walls
    path:   '#f0e8d8', // warm cream for open corridors
    start:  '#d1fae5', // soft green for the start cell
    exit:   '#fde68a', // golden yellow for the exit cell
    marker: '#92400e', // dark amber for the exit marker dot
    fur:    '#f8f0e8', // cream-white bunny body
    ear:    '#ffaabb', // pink ears
    eye:    '#1a1a2e', // very dark blue-purple eyes
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
  let facing: Direction = 'right';
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
   * Paints the pixel-art bunny sprite onto the canvas at the given cell.
   * Each pixel value maps to a colour defined in `C`.
   *
   * @param ctx    2D rendering context.
   * @param col    Bunny column in the maze grid.
   * @param row    Bunny row in the maze grid.
   * @param dir    The direction the bunny is facing.
   */
  function drawBunny(
    ctx: CanvasRenderingContext2D,
    col: number,
    row: number,
    dir: Direction
  ): void {
    const [px, py] = cellPixel(col, row);
    const sprite = SPRITES[dir];
    const colorMap: Record<PixVal, string | null> = {
      0: null, 1: C.fur, 2: C.ear, 3: C.eye,
    };

    // Each sprite pixel is rendered as a SPRITE_SCALE×SPRITE_SCALE block so
    // the bunny fills the full CELL without upscaling artifacts.
    for (let r = 0; r < SPRITE_SIZE; r++) {
      for (let c = 0; c < SPRITE_SIZE; c++) {
        const color = colorMap[sprite[r][c]];
        if (color === null) continue;
        ctx.fillStyle = color;
        ctx.fillRect(
          px + c * SPRITE_SCALE,
          py + r * SPRITE_SCALE,
          SPRITE_SCALE,
          SPRITE_SCALE,
        );
      }
    }
  }

  /** Redraws the entire maze and bunny. Called after every state change. */
  function render(): void {
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Walls fill everything; cells are punched out on top
    ctx.fillStyle = C.wall;
    ctx.fillRect(0, 0, CW, CH);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const [px, py] = cellPixel(col, row);

        // Cell background
        const isStart = col === 0 && row === 0;
        const isExit  = col === COLS - 1 && row === ROWS - 1;
        ctx.fillStyle = isStart ? C.start : isExit ? C.exit : C.path;
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

    // Exit marker: 6×6 dark dot centred in the exit cell (scaled with CELL).
    const [ex, ey] = cellPixel(COLS - 1, ROWS - 1);
    ctx.fillStyle = C.marker;
    ctx.fillRect(ex + 6, ey + 6, 6, 6);

    drawBunny(ctx, bunnyX, bunnyY, facing);
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

    facing = dir;
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
    <canvas bind:this={canvas} width={CW} height={CH}></canvas>

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
