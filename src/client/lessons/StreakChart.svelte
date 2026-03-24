<script lang="ts">
  import { getPlayedDates, getCurrentStreak, toLocalISODate } from '../streaks';

  type DayState = 'played' | 'empty' | 'future';

  interface DayCell {
    dateStr: string;
    state: DayState;
  }

  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // Only label alternate rows (M, W, F) to avoid clutter
  const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];

  const today = new Date();
  const todayStr = toLocalISODate(today);
  const dow = today.getDay(); // 0 = Sunday

  // Grid starts on the Sunday that is 7 full weeks before this week's Sunday
  const gridStart = new Date(today);
  gridStart.setDate(today.getDate() - dow - 49);

  const playedDates = getPlayedDates();
  const currentStreak = getCurrentStreak();

  // Build 8 week columns, each with 7 day cells (Sun–Sat)
  const weeks: DayCell[][] = Array.from({ length: 8 }, (_, col) =>
    Array.from({ length: 7 }, (_, row) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + col * 7 + row);
      const dateStr = toLocalISODate(d);
      const state: DayState =
        dateStr > todayStr ? 'future' :
        playedDates.has(dateStr) ? 'played' :
        'empty';
      return { dateStr, state };
    })
  );

  // Show a month label above a column only when the month changes from the previous column
  const monthLabels: (string | null)[] = weeks.map((week, col) => {
    const thisMonth = new Date(week[0].dateStr + 'T12:00:00').getMonth();
    if (col === 0) return MONTH_ABBR[thisMonth];
    const prevMonth = new Date(weeks[col - 1][0].dateStr + 'T12:00:00').getMonth();
    return thisMonth !== prevMonth ? MONTH_ABBR[thisMonth] : null;
  });
</script>

<section class="streak-section">
  <div class="streak-header">
    <span class="section-label">Practice history</span>
    {#if currentStreak > 0}
      <span class="streak-badge">🔥 {currentStreak} day{currentStreak !== 1 ? 's' : ''}</span>
    {:else}
      <span class="no-streak">Start your streak today!</span>
    {/if}
  </div>

  <div class="chart">
    <div class="day-labels">
      {#each DAY_LABELS as label}
        <div class="day-label">{label}</div>
      {/each}
    </div>

    <div class="grid">
      {#each weeks as week, col}
        <div class="week-col">
          <div class="month-label">{monthLabels[col] ?? ''}</div>
          {#each week as day}
            <div class="cell {day.state}" title={day.dateStr}></div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .streak-section {
    margin-top: 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .streak-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    justify-content: space-between;
  }

  .section-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .streak-badge {
    font-size: 0.9rem;
    font-weight: 700;
    color: #f0f0f0;
  }

  .no-streak {
    font-size: 0.85rem;
    color: #4b5563;
  }

  .chart {
    display: flex;
    gap: 5px;
    align-items: flex-end;
  }

  .day-labels {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-top: 20px; /* align with the cell rows below month labels */
  }

  .day-label {
    height: 14px;
    width: 14px;
    font-size: 10px;
    color: #4b5563;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 2px;
  }

  .grid {
    display: flex;
    gap: 4px;
  }

  .week-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .month-label {
    height: 16px;
    font-size: 10px;
    color: #4b5563;
    white-space: nowrap;
  }

  .cell {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .cell.played  { background: #6bcb77; }
  .cell.empty   { background: #252535; }
  .cell.future  { background: #1a1a25; }
</style>
