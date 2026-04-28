<script lang="ts">
  interface Props {
    /** Called when the user closes the certificate (e.g. taps Done). */
    onClose: () => void;
  }
  const { onClose }: Props = $props();

  // "Monday, April 27" — fixed at mount time, locale-aware.
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
</script>

<div class="cert-backdrop">
  <div class="cert">
    <div class="confetti" aria-hidden="true">
      <span>🎉</span><span>⭐</span><span>🌈</span><span>🏆</span>
      <span>✨</span><span>🎊</span><span>🌟</span><span>🎈</span>
    </div>

    <div class="cert-inner">
      <p class="cert-eyebrow">Certificate of Achievement</p>
      <div class="trophy" aria-hidden="true">🏆</div>
      <h1 class="cert-title">Awesome work!</h1>
      <p class="cert-subtitle">You finished today's lesson!</p>
      <p class="cert-date">{todayLabel}</p>

      <div class="cert-seal">
        <span class="cert-seal-text">Today's<br/>Champion</span>
      </div>

      <p class="cert-claim">
        Show this to your parents to claim your reward!
      </p>

      <button type="button" class="cert-done" onclick={onClose}>
        Done
      </button>
    </div>
  </div>
</div>

<style>
  .cert-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    background: rgba(4, 50, 76, 0.55);
    backdrop-filter: blur(4px);
    animation: fadeIn 250ms ease-out;
  }

  .cert {
    position: relative;
    width: 100%;
    max-width: 32rem;
    padding: var(--space-2);
    border-radius: var(--radius-xl);
    background:
      conic-gradient(
        from 0deg,
        #ff6b6b, #ffd93d, #6bcf7f, #4ecdc4, #5b8def, #c576f6, #ff6b6b
      );
    box-shadow: 0 24px 64px rgba(4, 50, 76, 0.35);
    animation: pop 450ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .cert-inner {
    position: relative;
    padding: var(--space-10) var(--space-8) var(--space-8);
    border-radius: calc(var(--radius-xl) - 0.5rem);
    background: #fffaf0;
    text-align: center;
    overflow: hidden;
  }

  .cert-inner::before {
    /* Subtle dotted texture so the inner panel doesn't feel flat. */
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255, 217, 61, 0.18) 1.5px, transparent 1.5px);
    background-size: 16px 16px;
    pointer-events: none;
  }

  .cert-eyebrow {
    position: relative;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #c576f6;
    margin-bottom: var(--space-4);
  }

  .trophy {
    position: relative;
    font-size: 4.5rem;
    line-height: 1;
    margin-bottom: var(--space-4);
    animation: wiggle 1.4s ease-in-out infinite;
  }

  .cert-title {
    position: relative;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1.1;
    background: linear-gradient(135deg, #ff6b6b, #ffd93d 50%, #6bcf7f);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: var(--space-2);
  }

  .cert-subtitle {
    position: relative;
    font-size: 1.125rem;
    font-weight: 600;
    color: #5b8def;
    margin-bottom: var(--space-2);
  }

  .cert-date {
    position: relative;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: #4a5568;
    letter-spacing: 0.04em;
    margin-bottom: var(--space-6);
  }

  .cert-seal {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 7rem;
    height: 7rem;
    margin: 0 auto var(--space-6);
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #ffd93d, #ff6b6b 75%);
    box-shadow: 0 8px 16px rgba(255, 107, 107, 0.35);
    transform: rotate(-8deg);
  }
  .cert-seal::before {
    content: '';
    position: absolute;
    inset: 6px;
    border-radius: 50%;
    border: 3px dashed rgba(255, 255, 255, 0.85);
  }
  .cert-seal-text {
    position: relative;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 0.95rem;
    font-weight: 800;
    line-height: 1.05;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  }

  .cert-claim {
    position: relative;
    font-size: 1rem;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: var(--space-6);
    padding: var(--space-3) var(--space-4);
    background: rgba(255, 217, 61, 0.25);
    border-radius: var(--radius-md);
    border: 2px dashed #ffd93d;
  }

  .cert-done {
    position: relative;
    padding: var(--space-3) var(--space-12);
    border: none;
    border-radius: var(--radius-full);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 1.125rem;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, #5b8def, #c576f6);
    cursor: pointer;
    box-shadow: 0 8px 16px rgba(91, 141, 239, 0.35);
    transition: transform 150ms ease-out, box-shadow 150ms ease-out;
  }
  .cert-done:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 20px rgba(91, 141, 239, 0.45);
  }
  .cert-done:active {
    transform: translateY(0);
  }

  /* Floating confetti emojis around the certificate frame. */
  .confetti {
    position: absolute;
    inset: -1.5rem;
    pointer-events: none;
  }
  .confetti span {
    position: absolute;
    font-size: 1.75rem;
    animation: float 3s ease-in-out infinite;
  }
  .confetti span:nth-child(1) { top:  -0.5rem; left:  10%; animation-delay: 0.0s; }
  .confetti span:nth-child(2) { top:   5%;     right: 8%;  animation-delay: 0.4s; }
  .confetti span:nth-child(3) { top:  35%;     left:  -1rem; animation-delay: 0.8s; }
  .confetti span:nth-child(4) { top:  35%;     right: -1rem; animation-delay: 1.2s; }
  .confetti span:nth-child(5) { bottom: 20%;   left:  -0.5rem; animation-delay: 1.6s; }
  .confetti span:nth-child(6) { bottom: 10%;   right: -0.5rem; animation-delay: 2.0s; }
  .confetti span:nth-child(7) { bottom: -1rem; left:  20%;  animation-delay: 0.6s; }
  .confetti span:nth-child(8) { bottom: -1rem; right: 25%;  animation-delay: 1.4s; }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pop {
    0%   { transform: scale(0.7); opacity: 0; }
    60%  { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes wiggle {
    0%, 100% { transform: rotate(-6deg); }
    50%      { transform: rotate(6deg); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(-8deg); }
    50%      { transform: translateY(-10px) rotate(8deg); }
  }
</style>
