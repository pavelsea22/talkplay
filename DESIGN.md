# Design System: The Imaginative Canvas

A bespoke framework that transforms clinical speech therapy into a world of discovery. Moving beyond heavy-border, primary-color children's UI, this system uses **Organic Layering** and **Luminous Tones** to create a premium, editorially-inspired digital playground.

---

## 1. Creative North Star

The UI is not a set of rigid boxes — it is a series of soft, floating clouds and layered paper-cutouts. Intentional asymmetry and tonal depth make the interface feel alive and encouraging rather than static and medical. Varying roundedness scales and shifting background intensities create a "gravity-defying" layout that reduces cognitive load for children while remaining sophisticated for parents and therapists.

---

## 2. CSS Design Tokens

Drop this block into your global stylesheet. All component specs below reference these variables.

```css
:root {
  /* === Surfaces === */
  --color-surface:                   #f1f7ff;
  --color-surface-dim:               #afd9ff;
  --color-surface-bright:            #dff0ff;
  --color-surface-container-lowest:  #ffffff;
  --color-surface-container-low:     #e7f2ff;
  --color-surface-container:         #d7eaff;
  --color-surface-container-high:    #cce5ff;
  --color-surface-container-highest: #c0e1ff;

  /* === On-Surface Text === */
  --color-on-surface:         #04324c;
  --color-on-surface-variant: #3b5f7c;

  /* === Primary === */
  --color-primary:           #006286;
  --color-primary-container: #37bcf7;
  --color-on-primary:        #ffffff;

  /* === Secondary === */
  --color-secondary:           #3a6b2a;
  --color-secondary-container: #c2efb1;
  --color-on-secondary-container: #355b2b;

  /* === Tertiary (Reward) === */
  --color-tertiary:           #8f4900;
  --color-tertiary-container: #fe9742;
  --color-on-tertiary:        #ffffff;

  /* === Outline === */
  --color-outline-variant: #8db1d1;

  /* === Roundedness === */
  --radius-sm:   0.5rem;
  --radius-md:   1rem;
  --radius-lg:   2rem;
  --radius-xl:   3rem;
  --radius-full: 9999px;

  /* === Spacing === */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.75rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* === Elevation / Shadow === */
  --shadow-ambient: 0 12px 32px rgba(4, 50, 76, 0.06);

  /* === Motion === */
  --duration-fast:   150ms;
  --duration-base:   250ms;
  --duration-slow:   400ms;
  --ease-out-soft:   cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out:     cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 3. Color & Tonal Architecture

### The "No-Line" Rule
**1px solid borders are strictly prohibited for sectioning.** Contrast and containment must be achieved through background shifts.

- Place a `--color-surface-container-lowest` card against a `--color-surface-container` backdrop to create a soft, approachable edge.
- If accessibility requires a visible boundary, use `--color-outline-variant` at **15% opacity** — it should be felt, not seen.

### Surface Nesting Hierarchy
Treat the UI as a physical stack of paper layers:

| Layer | Token | Hex |
|---|---|---|
| Page base | `surface` | `#f1f7ff` |
| Section backgrounds | `surface-container-low` | `#e7f2ff` |
| Interactive cards | `surface-container` | `#d7eaff` |
| Inner components | `surface-container-highest` | `#c0e1ff` |
| Deep nesting | `surface-dim` | `#afd9ff` |

### The "Glass & Gradient" Rule
- **Action Gradient:** `linear-gradient(135deg, var(--color-primary), var(--color-primary-container))`
- **Glassmorphism** (modals / tooltips): `background: rgba(255,255,255,0.85); backdrop-filter: blur(20px);`
  - **Fallback** (low-end devices / `prefers-reduced-transparency`): use solid `--color-surface-container-lowest`. Never leave the overlay transparent without a blur.

---

## 4. Typography

Import from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Be+Vietnam+Pro:wght@400;500;600&display=swap" rel="stylesheet">
```

### Type Scale

| Token | Font | Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| `display-lg` | Plus Jakarta Sans | 3.5rem | 800 | 1.1 | Milestone celebrations |
| `display-sm` | Plus Jakarta Sans | 2.25rem | 700 | 1.15 | Celebration Drawer heading |
| `headline-lg` | Plus Jakarta Sans | 1.75rem | 700 | 1.2 | Screen titles |
| `headline-md` | Plus Jakarta Sans | 1.375rem | 600 | 1.25 | Card headings |
| `title-md` | Be Vietnam Pro | 1.125rem | 600 | 1.3 | Section labels |
| `body-md` | Be Vietnam Pro | 1rem | 400 | 1.6 | Instructions, body copy |
| `body-sm` | Be Vietnam Pro | 0.875rem | 400 | 1.5 | Captions, helper text |
| `label-md` | Be Vietnam Pro | 0.875rem | 500 | 1.2 | Button labels, tags |

### Pairing Rule
Always pair `headline-md` in `--color-on-surface` with `body-md` in `--color-on-surface-variant` to create a clear visual hierarchy.

**Never use #000000 or #ffffff for body text.** Always use `--color-on-surface` and `--color-on-primary` respectively.

---

## 5. Elevation & Depth

**Reject drop-shadow culture.** Hierarchy is achieved through tonal layering.

- **Ambient Shadow** (floating elements only): `box-shadow: var(--shadow-ambient)` — soft cloud, not a digital box.
- **Ghost Border fallback:** `outline: 1px solid rgba(141, 177, 209, 0.15)`
- **Roundedness:** Use `--radius-xl` (3rem) for main containers, `--radius-full` for buttons. Never use `border-radius: 0` or `border-radius: 4px`. Every corner is a "friend."

---

## 6. Motion Principles

> **Context note:** This app is used by children who may have sensory sensitivities (ASD). Motion must feel calm and supportive, never jarring or distracting.

### Core Rules
- **Prefer easing over spring physics.** Use `--ease-out-soft` for entrances, `--ease-in-out` for state changes.
- **No autoplay animations** on therapy task screens. Motion should be triggered by user action or task completion only.
- **No looping animations** in the background during active tasks — they compete for attention.
- **Celebration animations** (balloon, confetti) are appropriate *only* after task completion, not during.

### Approved Motion Patterns
| Pattern | Duration | Easing | Usage |
|---|---|---|---|
| Card entrance (fade + translate Y) | `--duration-slow` | `--ease-out-soft` | Screen load |
| Button press "squish" | `--duration-fast` | `--ease-in-out` | `scale(0.95)` on active |
| Celebration Drawer slide-up | `--duration-slow` | `--ease-out-soft` | Task completion |
| Progress bar fill | `--duration-slow` | `--ease-out-soft` | Incremental progress |
| Hover background shift | `--duration-base` | `--ease-in-out` | Card hover |

### Reduced Motion
Always respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Components

### Buttons — "Interaction Clouds"
- **Primary:** Gradient fill, `--radius-full`, `--color-on-primary` text. No border. Squish on press.
- **Secondary:** `--color-secondary-container` fill, `--color-on-secondary-container` text.
- **Disabled:** 40% opacity. No cursor change needed for touch-first contexts.

### Progress Indicators — "Pathways"
- Track: `--color-surface-container-highest`
- Indicator: `--color-tertiary-container` (`#fe9742`) — warm pop against the blue-green palette
- Track end radius: `--radius-lg`

### Cards & Discovery Modules
- No dividers. Use `--space-10` (2.75rem) to separate content blocks.
- Hover/tap state: shift background from `--color-surface-container` to `--color-surface-bright` + apply `--shadow-ambient`.
- Main container radius: `--radius-xl`

### Input Fields
- Fill: `--color-surface-container-lowest`
- Focus: soft glow (`box-shadow: 0 0 0 4px rgba(0, 98, 134, 0.15)`) + label floats upward
- No thick borders on focus. Never.

### Celebration Drawer
A bottom-sheet that slides up on task completion.
- Background: `rgba(255, 255, 255, 0.85)` + `backdrop-filter: blur(20px)`
- Fallback: solid `--color-surface-container-lowest`
- Typography: `display-sm` for the main message, `body-md` for sub-copy
- Accent: `--color-tertiary-container` for reward icons/badges
- Radius: `--radius-xl` on top corners only

---

## 8. Layout Principles

- **Asymmetrical layouts encouraged.** Place large icons slightly overlapping card edges to create a sense of play.
- **Breathing room is premium.** Use the spacing scale — never eyeball gutters.
- Use `--color-tertiary` and `--color-tertiary-container` **sparingly** — they are reward accents, not general UI colors.
- No `<hr>` or horizontal rules. Use a background shift to `--color-surface-container-low` to separate sections.

---

## 9. Quick Reference: Do's and Don'ts

| Do | Don't |
|---|---|
| Use background shifts for separation | Use 1px solid borders for sections |
| Use `--radius-xl` or `--radius-full` on all containers | Use `border-radius` below `--radius-md` |
| Use `--color-on-surface` for all body text | Use `#000000` for text |
| Use CSS token variables throughout | Hardcode hex values in components |
| Respect `prefers-reduced-motion` | Autoplay looping animations on task screens |
| Use tertiary accents only for rewards | Use `--color-tertiary-container` as a general background |
| Provide solid fallbacks for glassmorphism | Rely on `backdrop-filter` without a fallback |
