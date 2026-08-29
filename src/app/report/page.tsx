"use client";

import { useMemo } from "react";
import { useStore, habitStreak, habitTotalCompletions, dailySeries, computeStreak } from "@/lib/store";
import { GlassCard, SectionLabel } from "@/components/ui";
import { todayKey, formatShort, relativeDay } from "@/lib/date";

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
