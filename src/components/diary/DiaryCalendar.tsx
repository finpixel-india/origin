"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import type { Entries } from "@/lib/store";
import {
  calendarMatrix,
  dayOfMonth,
  isFutureKey,
  parseKey,
  todayKey,
} from "@/lib/date";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function DiaryCalendar({
  open,
  onClose,
  entries,
  selected,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  entries: Entries;
  selected: string;
  onPick: (key: string) => void;
}) {
  const initial = parseKey(selected);
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());

  const cells = calendarMatrix(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const today = todayKey();

  const shift = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  };

  const pick = (key: string | null) => {
    if (!key || isFutureKey(key)) return;
    onPick(key);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Calendar">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => shift(-1)}
          className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-silver-400 transition hover:border-amethyst-400/40 hover:text-amethyst-200"
          aria-label="Previous month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="font-serif text-xl text-silver-100">{monthLabel}</span>
        <button
          onClick={() => shift(1)}
          className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-silver-400 transition hover:border-amethyst-400/40 hover:text-amethyst-200"
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="pb-2 text-[0.62rem] font-medium uppercase tracking-widest text-silver-600">
            {d}
          </div>
        ))}
        {cells.map((key, i) => {
          if (!key) return <div key={i} />;
          const future = isFutureKey(key);
          const hasEntry = !!entries[key];
          const isToday = key === today;
          const isSelected = key === selected;
          return (
            <button
              key={i}
              disabled={future}
              onClick={() => pick(key)}
              className={`relative grid h-11 place-items-center rounded-lg text-sm transition ${
                future
                  ? "cursor-not-allowed text-silver-700/40"
                  : isSelected
                    ? "bg-amethyst-500/25 text-silver-50 ring-1 ring-amethyst-400/50"
                    : "text-silver-300 hover:bg-white/[0.05]"
              }`}
            >
              {dayOfMonth(key)}
              {hasEntry && !isSelected && (
                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-amethyst-400/70" />
              )}
              {isToday && !isSelected && (
                <span className="absolute inset-0 rounded-lg ring-1 ring-amethyst-400/30" />
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-center text-[0.66rem] uppercase tracking-[0.2em] text-silver-600">
        Dots mark days with entries · future dates locked
      </p>
    </Modal>
  );
}
