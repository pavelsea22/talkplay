<script lang="ts">
  /** The two mini games the user can choose from. */
  export type MinigameId = 'maze' | 'balloon';

  interface GameOption {
    id: MinigameId;
    emoji: string;
    label: string;
    description: string;
  }

  interface Props {
    /** Called when the user selects a mini game. */
    onPick: (game: MinigameId) => void;
    /** Called when the user declines to play any mini game. */
    onDismiss?: () => void;
  }

  let { onPick, onDismiss }: Props = $props();

  const GAMES: GameOption[] = [
    {
      id: 'maze',
      emoji: '🐰',
      label: 'Find the Way!',
      description: 'Guide the bunny through a maze',
    },
    {
      id: 'balloon',
      emoji: '🎈',
      label: 'Pop the Balloons!',
      description: 'Tap to pop floating balloons',
    },
  ];
</script>

<div class="picker-overlay">
  <div class="picker-card">
    <h2 class="picker-heading">Pick a game!</h2>
    <div class="game-list">
      {#each GAMES as game (game.id)}
        <button class="game-btn" onclick={() => onPick(game.id)}>
          <span class="game-emoji">{game.emoji}</span>
          <span class="game-label">{game.label}</span>
          <span class="game-desc">{game.description}</span>
        </button>
      {/each}
    </div>
    {#if onDismiss}
      <button class="dismiss-btn" onclick={onDismiss}>No thanks</button>
    {/if}
  </div>
</div>

<style>
  .picker-overlay {
    position: fixed;
    inset: 0;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .picker-card {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px);
    border-radius: var(--radius-xl);
    padding: var(--space-8) var(--space-6);
    width: min(340px, calc(100vw - var(--space-8)));
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-6);
    box-shadow: var(--shadow-ambient);
    outline: 1px solid rgba(141, 177, 209, 0.15);
  }

  .picker-heading {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-on-surface);
    margin: 0;
    text-align: center;
  }

  .game-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    width: 100%;
  }

  .game-btn {
    display: grid;
    grid-template-columns: 3rem 1fr;
    grid-template-rows: auto auto;
    column-gap: var(--space-3);
    align-items: center;
    padding: var(--space-4) var(--space-5);
    border: 2px solid transparent;
    border-radius: var(--radius-lg);
    background: var(--color-surface-container-low, #f5f5f5);
    cursor: pointer;
    text-align: left;
    transition:
      border-color  var(--duration-fast) var(--ease-in-out),
      transform     var(--duration-fast) var(--ease-in-out),
      box-shadow    var(--duration-fast) var(--ease-in-out);
  }

  .game-btn:hover {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
  }

  .game-btn:active {
    transform: scale(0.97);
  }

  .game-emoji {
    grid-row: 1 / 3;
    font-size: 2rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .game-label {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-on-surface);
    line-height: 1.2;
  }

  .game-desc {
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 0.8125rem;
    font-weight: 400;
    color: var(--color-on-surface-variant);
    line-height: 1.3;
  }

  .dismiss-btn {
    background: none;
    border: none;
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 0.875rem;
    color: var(--color-on-surface-variant);
    cursor: pointer;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    transition: color var(--duration-fast) var(--ease-in-out);
  }

  .dismiss-btn:hover {
    color: var(--color-on-surface);
  }
</style>
