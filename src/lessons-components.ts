import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * A clickable lesson card that links to a practice activity.
 *
 * @attr sound  - The phoneme label displayed prominently (e.g. "/T/").
 * @attr label  - A short description shown below the sound (e.g. "10 words").
 * @attr href   - The URL the card navigates to when clicked.
 */
@customElement("lesson-card")
export class LessonCard extends LitElement {
  @property() sound = "";
  @property() label = "";
  @property() href = "/";

  static styles = css`
    :host {
      display: block;
    }

    a {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 160px;
      height: 180px;
      background: #1e1e2e;
      border: 2px solid #2d2d44;
      border-radius: 20px;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      transition: background 0.2s, border-color 0.2s, transform 0.1s;
      gap: 0.5rem;
      font-family: 'Baloo 2', system-ui, sans-serif;
    }

    a:hover {
      background: #25253a;
      border-color: #2563eb;
    }

    a:active {
      transform: scale(0.97);
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
  `;

  render() {
    return html`
      <a href=${this.href}>
        <span class="sound">${this.sound}</span>
        <span class="label">${this.label}</span>
      </a>
    `;
  }
}
