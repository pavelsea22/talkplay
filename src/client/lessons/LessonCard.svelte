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
    background: #1e1e2e;
    border: 2px solid #2d2d44;
    border-radius: 20px;
    text-decoration: none;
    transition: border-color 0.2s, background 0.2s;
    gap: 0.5rem;
    font-family: 'Baloo 2', system-ui, sans-serif;
  }

  .card:hover {
    border-color: #2563eb;
    background: #1e1e38;
  }

  .sound {
    font-size: 3.5rem;
    font-weight: 800;
    color: #60a5fa;
    line-height: 1;
  }

  .label {
    font-size: 0.95rem;
    font-weight: 600;
    color: #9ca3af;
  }
</style>
