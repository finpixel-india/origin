"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import type { DiaryEntry, Habit } from "@/lib/store";
import { formatLong, relativeDay, weekdayName, dayOfMonth, monthName } from "@/lib/date";

export type Side = "left" | "right" | "single";

export function PageShell({
  side,
  children,
  className = "",
}: {
  side: Side;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`diary-page grain ${side} h-full w-full ${className}`}>
      <div className="relative z-[2] flex h-full flex-col overflow-y-auto overscroll-contain px-6 py-5 md:px-7 md:py-5">
        {children}
      </div>
    </div>
  );
}

function DiaryLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1.5 text-[0.6rem] font-medium uppercase tracking-[0.26em] text-amethyst-300/75">
      {children}
    </div>
  );
}

function ProseInput({
  value,
  onChange,
  placeholder,
  minH = 48,
  interactive,
  syncKey,
  variant = "line",
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  minH?: number;
  interactive: boolean;
  syncKey?: string;
  variant?: "line" | "journal";
}) {
  // Locally-buffered value keeps typing instant and decoupled from the global
  // store (which persists on a debounce). Re-syncs when the day/entry changes.
  const [local, setLocal] = useState(value);
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) setLocal(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, syncKey]);

  const base =
    variant === "journal"
      ? "journal-input w-full flex-1 resize-none font-serif text-[1.08rem] not-italic leading-[2.05rem] text-silver-100 placeholder:text-silver-700/55"
      : "prose-input w-full resize-none font-serif text-[1.02rem] not-italic leading-relaxed text-silver-200 placeholder:text-silver-700/60 pb-1";

  return (
    <textarea
      value={interactive ? local : value}
      readOnly={!interactive}
      onFocus={() => (editing.current = true)}
      onBlur={() => (editing.current = false)}
      onChange={(e) => {
        setLocal(e.target.value);
        onChange?.(e.target.value);
      }}
      placeholder={placeholder}
      style={{ minHeight: minH }}
      className={base}
    />
  );
}

export function PageDateHeader({
  entry,
  streak,
}: {
  entry: DiaryEntry;
  streak: number;
}) {
  return (
    <div className="mb-3 shrink-0">
      <div className="flex items-end gap-2.5">
        <h2 className="font-serif text-[1.75rem] font-medium leading-none text-silver-50">
          {dayOfMonth(entry.date)}
        </h2>
        <div className="pb-0.5">
          <div className="font-serif text-base leading-none text-silver-200">
            {monthName(entry.date)}
          </div>
          <div className="mt-1 text-[0.6rem] uppercase tracking-[0.18em] text-silver-600">
            {weekdayName(entry.date)}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 pb-0.5 text-[0.66rem] text-silver-500">
          {streak > 0 && (
            <span className="inline-flex items-center gap-1">
              <span>🔥</span>
              <span className="font-medium text-amethyst-200">{streak}</span>
            </span>
          )}
          <span className="text-silver-600">{relativeDay(entry.date)}</span>
        </div>
      </div>
      <div className="mt-2.5 h-px w-full accent-line opacity-50" />
    </div>
  );
}

export function LeftPageContent({
  entry,
  habits,
  stats,
  streak,
  interactive,
  onToggle,
  onText,
}: {
  entry: DiaryEntry;
  habits: Habit[];
  stats: { done: number; total: number; pct: number };
  streak: number;
  interactive: boolean;
  onToggle: (id: string) => void;
  onText: (field: keyof DiaryEntry, value: string) => void;
}) {
  const active = habits.filter((h) => !h.archived);
  return (
    <>
      <PageDateHeader entry={entry} streak={streak} />

      <div className="shrink-0">
        <div className="mb-1.5 flex items-center justify-between">
          <DiaryLabel>Today&apos;s Ritual</DiaryLabel>
          <span className="text-[0.64rem] text-silver-600">
            {stats.done}/{stats.total}
          </span>
        </div>
        <div className="space-y-0.5">
          {active.length === 0 && (
            <Link
              href="/settings"
              prefetch={true}
              className="block rounded-lg border border-dashed border-amethyst-400/25 bg-amethyst-500/5 px-4 py-5 text-center transition hover:border-amethyst-400/45 hover:bg-amethyst-500/10"
            >
              <p className="font-serif text-base text-silver-400">No habits added yet</p>
              <p className="mt-1.5 text-[0.66rem] uppercase tracking-[0.2em] text-amethyst-300/80">
                Tap here → Settings to add them
              </p>
            </Link>
          )}
          {active.map((h) => {
            const done = !!entry.completions[h.id];
            return (
              <button
                key={h.id}
                type="button"
                disabled={!interactive}
                onClick={() => onToggle(h.id)}
                className={`group/habit press row-hover flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left ${
                  interactive ? "hover:bg-white/[0.045]" : ""
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.5,1)] ${
                    done
                      ? "scale-100 border-amethyst-400/60 bg-amethyst-500/25 text-amethyst-100"
                      : "border-white/15 text-transparent group-hover/habit:border-amethyst-400/40"
                  }`}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    className={`transition-transform duration-300 ${done ? "scale-100" : "scale-50"}`}
                  >
                    <path d="m5 12 5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-base leading-none transition-transform duration-300 group-hover/habit:scale-110">
                  {h.emoji}
                </span>
                <span
                  className={`flex-1 text-[0.92rem] transition-colors duration-300 ${
                    done ? "text-silver-400 line-through decoration-amethyst-400/30" : "text-silver-200"
                  }`}
                >
                  {h.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <DiaryLabel>A Note To Self</DiaryLabel>
        <ProseInput
          value={entry.todaysThoughts}
          onChange={(v) => onText("todaysThoughts", v)}
          placeholder="Anything on your mind…"
          minH={120}
          interactive={interactive}
          syncKey={entry.date}
          variant="journal"
        />
      </div>
    </>
  );
}

export function RightPageContent({
  entry,
  interactive,
  onText,
  showDate = true,
}: {
  entry: DiaryEntry;
  interactive: boolean;
  onText: (field: keyof DiaryEntry, value: string) => void;
  showDate?: boolean;
}) {
  return (
    <>
      <div className="mb-3 shrink-0">
        <div className="flex items-baseline justify-between">
          <h3 className="font-serif text-lg leading-none text-silver-100">Today&apos;s Journal</h3>
          <span className="text-[0.58rem] uppercase tracking-[0.2em] text-silver-600">
            What did you do today?
          </span>
        </div>
        <div className="mt-2.5 h-px w-full accent-line opacity-50" />
      </div>

      <div className="journal-lines flex min-h-0 flex-1 flex-col">
        <ProseInput
          value={entry.accomplished}
          onChange={(v) => onText("accomplished", v)}
          placeholder="Write about your day — what you did, how it felt, what mattered…"
          minH={260}
          interactive={interactive}
          syncKey={entry.date}
          variant="journal"
        />
      </div>

      {showDate && (
        <div className="mt-3 flex shrink-0 items-center justify-between border-t border-white/[0.06] pt-2.5 text-[0.6rem] uppercase tracking-[0.16em] text-silver-600">
          <span>{formatLong(entry.date)}</span>
          <span className="inline-flex items-center gap-1.5 text-amethyst-300/70">
            <span className="h-1.5 w-1.5 rounded-full bg-amethyst-400/70" />
            {entry.accomplished.trim() || entry.todaysThoughts.trim() ? "Written" : "Unwritten"}
          </span>
        </div>
      )}
    </>
  );
}

export function SinglePageContent(props: {
  entry: DiaryEntry;
  habits: Habit[];
  stats: { done: number; total: number; pct: number };
  streak: number;
  interactive: boolean;
  onToggle: (id: string) => void;
  onText: (field: keyof DiaryEntry, value: string) => void;
}) {
  return (
    <>
      <LeftPageContent {...props} />
      <div className="my-5 h-px w-full accent-line opacity-40" />
      <RightPageContent entry={props.entry} interactive={props.interactive} onText={props.onText} showDate />
    </>
  );
}
