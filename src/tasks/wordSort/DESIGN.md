# WordSort Task — Design

## Overview

The user is presented with 4 word cards and 2 labeled buckets. They drag each word into the correct bucket. Correct drops are accepted with a positive animation; incorrect drops are rejected with a shake and snap-back. Once all 4 words are correctly placed, the task completes and counts toward lesson progress.

---

## Task Type

```typescript
interface WordSortTask {
  type: 'wordSort';
  /** Exactly 4 words to sort. */
  words: string[];
  /** Labels for the two buckets, e.g. ["starts with /d/", "starts with /t/"]. */
  buckets: [string, string];
  /** Maps each word to the index (0 or 1) of its correct bucket. */
  correctBucket: Record<string, 0 | 1>;
}
```

---

## Word Sets

Grounded in the existing `/d/` and `/t/` sound groups in `words.ts`. Each set has exactly 4 words (2 per bucket).

### Set 1 — /d/ vs /t/ (leading position)
| Word | Bucket |
|------|--------|
| dog  | starts with /d/ |
| duck | starts with /d/ |
| ten  | starts with /t/ |
| top  | starts with /t/ |

### Set 2 — /d/ vs /t/ (leading position, different words)
| Word | Bucket |
|------|--------|
| dip  | starts with /d/ |
| dime | starts with /d/ |
| tip  | starts with /t/ |
| time | starts with /t/ |

### Set 3 — /d/ vs /t/ (harder minimal pairs)
| Word | Bucket |
|------|--------|
| den  | starts with /d/ |
| dot  | starts with /d/ |
| tent | starts with /t/ |
| talk | starts with /t/ |

### Future sets (when more sounds are added)
- /s/ vs /z/ trailing position (e.g. "bus/buzz", "ice/eyes")
- Short /ɪ/ vs long /iː/ (e.g. "bit/beat", "ship/sheep")
- /p/ vs /b/ leading (e.g. "pan/ban", "pit/bit")

---

## UI Layout

```
┌──────────────────────────────────────┐
│   Sort the words into the buckets    │
│                                      │
│   ┌──────┐  ┌──────┐                │
│   │ dog  │  │ ten  │                │  ← word pool (shuffled)
│   └──────┘  └──────┘                │
│   ┌──────┐  ┌──────┐                │
│   │ duck │  │ top  │                │
│   └──────┘  └──────┘                │
│                                      │
│   ┌──────────────┐ ┌──────────────┐ │
│   │ starts with  │ │ starts with  │ │  ← drop buckets
│   │     /d/      │ │     /t/      │ │
│   │              │ │              │ │
│   └──────────────┘ └──────────────┘ │
└──────────────────────────────────────┘
```

Words start in a 2×2 grid above the buckets. Correctly placed words move into the bucket and are displayed there in a smaller style. The pool slot for a placed word becomes empty (collapsed or hidden).

---

## Drag & Drop

No library — use the **HTML5 Drag and Drop API** for mouse and a **touch event mirror** for mobile.

### Mouse
- `draggable="true"` on each word card
- `ondragstart`: store dragged word in local state, add `.dragging` class for visual feedback
- `ondragover`: `preventDefault()` to allow drop
- `ondrop` on each bucket: evaluate and dispatch accept or reject

### Touch
- `ontouchstart`: record word and initial position
- `ontouchmove`: translate the card to follow the finger (position: fixed clone)
- `ontouchend`: hit-test against bucket bounding rects to determine drop target

Both paths call the same `handleDrop(word, bucketIndex)` function.

---

## Evaluation

Synchronous — no server call needed.

```typescript
function evaluateWordSort(word: string, bucketIndex: 0 | 1, task: WordSortTask): 'correct' | 'incorrect'
```

Called per drop. The Activity component tracks placed words locally and calls `onComplete` once all 4 are correctly placed.

---

## Activity State

```typescript
let remaining = $state([...task.words]);          // words still in the pool
let placed    = $state<Record<string, 0 | 1>>({}); // word → bucket it was placed in
let locked    = $state(false);                     // block input during reject animation
let dragging  = $state<string | null>(null);       // word currently being dragged
```

No retry counter. A rejected word simply returns to the pool and the user tries again. There is no failure state — the task ends only on full success.

---

## Animations (CSS keyframes)

### Accept
1. Word card scales down and slides into the bucket (translate + scale, ~300ms ease-in).
2. Bucket briefly scales to 1.05× and glows green (`box-shadow` pulse, ~400ms).
3. Word reappears inside the bucket at 0.75× size with muted styling.

### Reject
1. Word card shakes horizontally — reuse the existing `shake` keyframe (~400ms).
2. Bucket briefly flashes a red border.
3. `locked` is set to `true` for the animation duration, then released.
4. Word snaps back to its original pool position.

---

## Registering the Task

1. Export `WordSortTask` type and `pickWordSortLesson()` from `src/tasks/wordSort/index.ts`.
2. Add `WordSortTask` to the `Task` union in `src/tasks/index.ts`.
3. Call `pickWordSortLesson()` inside `pickLesson()` — adjust the existing 60/40 split to a three-way split (e.g. 50% DrillWord / 30% MinPair / 20% WordSort).
4. Add `{:else if currentTask.type === 'wordSort'}` branch in `src/client/activity/App.svelte`.

---

## Out of Scope (for now)

- TTS playback of words
- Partial scoring (pass/fail is all-or-nothing at task completion)
- More than 2 buckets
- Illustrations on word cards (text only)
