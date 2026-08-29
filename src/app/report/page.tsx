"use client";

import { useMemo } from "react";
import { useStore, habitStreak, habitTotalCompletions, dailySeries, computeStreak, type Entries, type Habit } from "@/lib/store";
import { GlassCard, SectionLabel } from "@/components/ui";
import { todayKey, formatShort, relativeDay, addDaysKey, parseKey } from "@/lib/date";

/** Build 365-day heatmap data: weeks × days grid with completion ratios. */
function buildHeatmap(
  entries: Record<string, { completions: Record<string, boolean> }>,
  habits: { id: string; archived?: boolean }[],
  today: string
): { date: string; ratio: number }[][] {
  const active = habits.filter((h) => !h.archived);
  const total = active.length;
  const weeks: { date: string; ratio: number }[][] = [];
  // Walk back 364 days (52 full weeks + today's partial week)
  const startOffset = 364;
  const startDate = addDaysKey(today, -startOffset);
  const startDow = parseKey(startDate).getDay(); // 0=Sun
  let cursor = addDaysKey(startDate, -startDow); // align to Sunday
  const endDate = today;

  let week: { date: string; ratio: number }[] = [];
  while (cursor <= endDate || week.length % 7 !== 0) {
    const e = entries[cursor];
    const done = total > 0 && e ? active.filter((h) => e.completions[h.id]).length : 0;
    const ratio = total > 0 ? done / total : 0;
    const isFuture = cursor > today;
    week.push({ date: cursor, ratio: isFuture ? -1 : ratio });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    cursor = addDaysKey(cursor, 1);
  }
  if (week.length > 0) weeks.push(week);
  return weeks;
}

const HEATMAP_COLORS = [
  "rgba(255,255,255,0.04)",  // 0: no activity
  "#2d2350",                  // 1-25%
  "#3b2d6b",                  // 26-50%
  "#6353a8",                  // 51-75%
  "#9788db",                  // 76-99%
  "#cfc6f5",                  // 100%
];

function heatColor(ratio: number): string {
  if (ratio < 0) return "transparent"; // future
  if (ratio === 0) return HEATMAP_COLORS[0];
  if (ratio <= 0.25) return HEATMAP_COLORS[1];
  if (ratio <= 0.5) return HEATMAP_COLORS[2];
  if (ratio <= 0.75) return HEATMAP_COLORS[3];
  if (ratio < 1) return HEATMAP_COLORS[4];
  return HEATMAP_COLORS[5];
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function ReportPage() {
  const { habits, entries } = useStore();
  const activeHabits = habits.filter((h) => !h.archived);
  const today = todayKey();

  const series = useMemo(() => dailySeries(entries, habits, 30, today), [entries, habits, today]);
  const overallStreak = useMemo(() => computeStreak(entries, habits, today, false), [entries, habits, today]);

  const perHabit = useMemo(
    () =>
      activeHabits.map((h) => ({
        habit: h,
        streak: habitStreak(entries, h.id, today),
        total: habitTotalCompletions(entries, h.id),
      })),
    [activeHabits, entries, today]
  );

  const heatmap = useMemo(() => buildHeatmap(entries, habits, today), [entries, habits, today]);

  const totalDaysTracked = useMemo(
    () => Object.keys(entries).filter((k) => Object.keys(entries[k]?.completions ?? {}).length > 0).length,
    [entries]
  );
  const todayDone = series.length ? series[series.length - 1].done : 0;

  // ── SVG line graph data ──
  const W = 1000;
  const H = 260;
  const padX = 34;
  const padY = 26;
  const maxCount = Math.max(1, ...series.map((s) => s.total));
  const pts = series.map((s, i) => {
    const x = padX + (i / Math.max(1, series.length - 1)) * (W - padX * 2);
    const y = padY + (H - padY * 2) * (1 - (s.total ? s.done / s.total : 0));
    return { x, y, ...s };
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const lastX = pts.length ? pts[pts.length - 1].x.toFixed(1) : padX.toFixed(1);
  const area = `${line} L ${lastX} ${H - padY} L ${padX} ${H - padY} Z`;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header>
        <SectionLabel>Report</SectionLabel>
        <h1 className="mt-2 font-serif text-[clamp(2rem,4.5vw,3rem)] font-medium text-silver-50">
          Your habit report
        </h1>
        <p className="mt-1 text-sm text-silver-500">
          Completion, streaks and momentum across the last 30 days.
        </p>
      </header>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="p-5">
          <SectionLabel>Today</SectionLabel>
          <div className="mt-2 font-serif text-3xl text-silver-50">
            {todayDone}<span className="text-lg text-silver-600">/{activeHabits.length || 0}</span>
          </div>
          <p className="mt-1 text-xs text-silver-600">habits completed today</p>
        </GlassCard>
        <GlassCard className="p-5">
          <SectionLabel>Overall Streak</SectionLabel>
          <div className="mt-2 font-serif text-3xl text-silver-50">🔥 {overallStreak}</div>
          <p className="mt-1 text-xs text-silver-600">consecutive days</p>
        </GlassCard>
        <GlassCard className="p-5">
          <SectionLabel>Days Tracked</SectionLabel>
          <div className="mt-2 font-serif text-3xl text-silver-50">{totalDaysTracked}</div>
          <p className="mt-1 text-xs text-silver-600">days with activity</p>
        </GlassCard>
        <GlassCard className="p-5">
          <SectionLabel>Habits</SectionLabel>
          <div className="mt-2 font-serif text-3xl text-silver-50">{activeHabits.length}</div>
          <p className="mt-1 text-xs text-silver-600">active rituals</p>
        </GlassCard>
      </div>

      {/* Line graph */}
      <GlassCard className="mt-5 p-6">
        <div className="flex items-center justify-between">
          <SectionLabel>Completion — last 30 days</SectionLabel>
          <span className="text-[0.62rem] uppercase tracking-[0.18em] text-silver-600">% of habits done</span>
        </div>

        {series.length === 0 || activeHabits.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-white/10 px-6 py-10 text-center font-serif text-lg italic text-silver-500">
            {activeHabits.length === 0
              ? "Add habits in Settings, then check them off in the diary to build your report."
              : "Complete some habits in the diary to see your trend line here."}
          </p>
        ) : (
          <div className="mt-5">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Habit completion line graph">
              <defs>
                <linearGradient id="reportArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#9788db" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#9788db" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="reportLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#6353a8" />
                  <stop offset="1" stopColor="#b3a6ea" />
                </linearGradient>
              </defs>
              {/* gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((g) => {
                const y = padY + (H - padY * 2) * g;
                return (
                  <line key={g} x1={padX} x2={W - padX} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                );
              })}
              {/* area + line */}
              <path d={area} fill="url(#reportArea)" />
              <path d={line} fill="none" stroke="url(#reportLine)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              {/* last point dot */}
              {pts.length > 0 && (
                <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="5" fill="#b3a6ea" stroke="#000" strokeWidth="2" />
              )}
              {/* x labels */}
              {pts.filter((_, i) => i % 5 === 0).map((p, idx) => (
                <text key={idx} x={p.x} y={H - 8} fill="rgba(255,255,255,0.35)" fontSize="11" textAnchor="middle">
                  {formatShort(p.date)}
                </text>
              ))}
            </svg>
            <div className="mt-2 flex justify-between text-[0.6rem] uppercase tracking-widest text-silver-700">
              <span>{relativeDay(series[0]?.date ?? today)}</span>
              <span>Today</span>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Activity heatmap */}
      <GlassCard className="mt-5 p-6">
        <div className="flex items-center justify-between">
          <SectionLabel>Activity — past year</SectionLabel>
          <div className="flex items-center gap-2 text-[0.58rem] text-silver-600">
            <span>Less</span>
            {HEATMAP_COLORS.slice(0, 6).map((c, i) => (
              <span
                key={i}
                className="inline-block h-[10px] w-[10px] rounded-[2px]"
                style={{ background: c }}
              />
            ))}
            <span>More</span>
          </div>
        </div>

        {activeHabits.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-white/10 px-6 py-10 text-center font-serif text-lg italic text-silver-500">
            Add habits in Settings to see your activity heatmap.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <div className="inline-flex gap-[3px]" style={{ minWidth: "max-content" }}>
              {/* Day labels column */}
              <div className="flex flex-col gap-[3px] pr-1 pt-[18px]">
                {DAY_LABELS.map((d, i) => (
                  <span
                    key={d}
                    className="flex h-[11px] items-center text-[9px] leading-none text-silver-700"
                    style={{ visibility: i % 2 === 1 ? "visible" : "hidden" }}
                  >
                    {d}
                  </span>
                ))}
              </div>
              {/* Weeks grid */}
              {heatmap.map((week, wi) => {
                // Month label: show if this week contains the 1st of a month
                const monthStart = week.find((d) => d.date.endsWith("-01"));
                const monthLabel = monthStart
                  ? MONTH_LABELS[parseInt(monthStart.date.split("-")[1], 10) - 1]
                  : null;
                return (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    <span className="flex h-[14px] items-end text-[9px] leading-none text-silver-600">
                      {monthLabel ?? ""}
                    </span>
                    {week.map((day) => (
                      <span
                        key={day.date}
                        title={day.ratio >= 0 ? `${day.date}: ${Math.round(day.ratio * 100)}%` : ""}
                        className="h-[11px] w-[11px] rounded-[2px] transition-colors duration-200"
                        style={{ background: heatColor(day.ratio) }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Per-habit streaks */}
      <div className="mt-5">
        <SectionLabel>Streak by habit</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {perHabit.length === 0 && (
            <GlassCard className="p-5">
              <p className="font-serif text-lg italic text-silver-500">
                No habits yet. Add them in Settings.
              </p>
            </GlassCard>
          )}
          {perHabit.map(({ habit, streak, total }) => (
            <GlassCard key={habit.id} className="flex items-center gap-4 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-xl">
                {habit.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-silver-100">{habit.name}</p>
                <p className="mt-0.5 text-xs text-silver-600">{total} completed total</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-serif text-2xl text-silver-50">{streak}</div>
                <div className="text-[0.6rem] uppercase tracking-widest text-silver-600">day streak</div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
