"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { DiaryBook } from "@/components/diary/DiaryBook";
import type { DiaryEntry } from "@/lib/store";
import { addDaysKey, diffInDays, formatLong, todayKey } from "@/lib/date";
import { LogoMark } from "@/components/Logo";
import { GlassCard } from "@/components/ui";

export default function DiaryPage() {
  const {
    ready,
    habits,
    entries,
    getEntry,
    updateEntry,
    toggleHabit,
    settings,
    setSettings,
  } = useStore();

  const [key, setKey] = useState<string>("");

  useEffect(() => {
    if (ready && !key) setKey(todayKey());
  }, [ready, key]);

  const today = todayKey();
  const canNext = diffInDays(key, today) < 0;
  const hasHabits = habits.filter((h) => !h.archived).length > 0;

  const onPatch = (date: string, field: keyof DiaryEntry, value: string) =>
    updateEntry(date, { [field]: value });

  /* ── no habits yet ── onboarding screen ── */
  if (ready && !hasHabits) {
    return (
      <div className="mx-auto max-w-xl py-16">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={44} />
          <h1 className="mt-6 font-serif text-3xl text-silver-50">
            Your diary is ready.
          </h1>
          <p className="mt-3 max-w-sm text-base text-silver-500">
            Before you open the pages, add the daily rituals you want to track
            on the left side of the diary.
          </p>
        </div>

        <GlassCard className="mt-10 p-6">
          <p className="text-[0.66rem] uppercase tracking-[0.24em] text-silver-600">Step 1</p>
          <h2 className="mt-2 font-serif text-xl text-silver-100">Add your daily habits</h2>
          <p className="mt-2 text-sm text-silver-500">
            Go to Settings → Daily Habits and add the rituals you want to check
            off each day — waking early, working out, reading, whatever shapes
            your ideal day.
          </p>
          <Link
            href="/settings"
            prefetch={true}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-amethyst-400/40 bg-amethyst-500/15 px-4 py-2.5 text-sm font-medium text-amethyst-200 transition hover:-translate-y-0.5 hover:bg-amethyst-500/25"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" strokeLinecap="round" />
            </svg>
            Open Settings → Daily Habits
          </Link>

          <div className="mt-5 border-t border-white/[0.07] pt-5">
            <p className="text-[0.66rem] uppercase tracking-[0.24em] text-silver-600">Step 2</p>
            <h2 className="mt-2 font-serif text-xl text-silver-100">Come back here every day</h2>
            <p className="mt-2 text-sm text-silver-500">
              Each day the diary opens fresh. Check off your habits on the left
              page and write about your day on the right. The pages turn
              smoothly between days.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  /* ── loading ── */
  if (!key) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-silver-600">
        <div className="animate-pulse">
          <LogoMark size={40} />
        </div>
        <p className="mt-5 font-serif text-lg italic">Opening your diary…</p>
      </div>
    );
  }

  /* ── diary ── */
  return (
    <div className="mx-auto flex w-full max-w-[1520px] flex-col lg:h-[calc(100vh-2.5rem)] lg:min-h-0 lg:overflow-hidden">
      <header className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-silver-600">
            <LogoMark size={14} />
            <span className="text-[0.58rem] font-medium uppercase tracking-[0.28em]">Daily Habit</span>
          </div>
          <div className="mt-0.5 flex items-center gap-3">
            <h1 className="font-serif text-[clamp(1.25rem,2.4vw,1.65rem)] font-medium leading-tight text-silver-50">
              {formatLong(key)}
            </h1>
            {key !== today && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.16em] text-silver-500">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                Read only
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-silver-600">
            {habits.filter(h => !h.archived).length} habit{habits.filter(h => !h.archived).length !== 1 ? "s" : ""} tracked
          </span>
          <Link
            href="/settings"
            prefetch={true}
            className="press inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.025] px-3.5 py-1.5 text-[0.66rem] uppercase tracking-[0.16em] text-silver-400 hover:border-amethyst-400/30 hover:text-amethyst-200"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" strokeLinecap="round" />
            </svg>
            Manage habits
          </Link>
        </div>
      </header>

      <DiaryBook
        currentKey={key}
        currentEntry={getEntry(key)}
        entries={entries}
        habits={habits}
        canNext={canNext}
        onNavigate={(dir) => setKey((k) => addDaysKey(k, dir === "next" ? 1 : -1))}
        onJump={(k) => setKey(k)}
        onPatch={onPatch}
        onToggleHabit={toggleHabit}
        paperSound={settings.paperSound}
        onToggleSound={() => setSettings((s) => ({ ...s, paperSound: !s.paperSound }))}
      />
    </div>
  );
}
