<script lang="ts">
  interface Props {
    onclick: () => void;
  }

  let { onclick }: Props = $props();
</script>

<button {onclick}>Next →</button>

<style>
  button {
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

  button:hover  { opacity: 0.9; }
  button:active { transform: scale(0.95); }
</style>
