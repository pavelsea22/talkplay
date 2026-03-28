<script lang="ts">
  let { sound, label, href }: { sound: string; label: string; href: string } = $props();
</script>

<a {href} class="card">
  <span class="sound">{sound}</span>
  <span class="label">{label}</span>
</a>

<style>
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 160px;
    height: 180px;
    background: var(--color-surface-container);
    border-radius: var(--radius-xl);
    text-decoration: none;
    gap: var(--space-2);
    outline: 1px solid rgba(141, 177, 209, 0.15);
    transition:
      background  var(--duration-base) var(--ease-in-out),
      box-shadow  var(--duration-base) var(--ease-in-out),
      transform   var(--duration-fast) var(--ease-in-out);
  }

  .card:hover {
    background: var(--color-surface-bright);
    box-shadow: var(--shadow-ambient);
  }

  .card:active {
    transform: scale(0.95);
  }

  .sound {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 3.5rem;
    font-weight: 800;
    color: var(--color-primary);
    line-height: 1;
  }

  .label {
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-on-surface-variant);
  }
</style>
