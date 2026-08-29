"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { DiaryEntry, Habit } from "@/lib/store";
import { computeStreak, habitStats, type Entries } from "@/lib/store";
import { clamp, easeInOut } from "@/lib/format";
import { paperAudio } from "@/lib/audio";
import {
  addDaysKey,
  formatLong,
  isFutureKey,
  relativeDay,
  todayKey,
} from "@/lib/date";
import {
  LeftPageContent,
  PageShell,
  RightPageContent,
  SinglePageContent,
} from "./DiarySections";
import { DiaryCalendar } from "./DiaryCalendar";

type Dir = "next" | "prev";
type Turn = { dir: Dir; progress: number } | null;

interface DiaryBookProps {
  currentKey: string;
  currentEntry: DiaryEntry;
  entries: Entries;
  habits: Habit[];
  canNext: boolean;
  onNavigate: (dir: Dir) => void;
  onJump: (key: string) => void;
  onPatch: (key: string, field: keyof DiaryEntry, value: string) => void;
  onToggleHabit: (key: string, id: string) => void;
  paperSound: boolean;
  onToggleSound: () => void;
}

function useIsMobile() {
  // DiaryBook only ever mounts client-side (the page shows a loader until the
  // date key is set), so reading matchMedia up front is safe and avoids a
  // one-frame layout flash.
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches
  );
  useEffect(() => {
    // Must match Tailwind's `lg` breakpoint: below 1024px we use the
    // single-page flow layout, at/above we use the fixed-height spread.
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

export function DiaryBook({
  currentKey,
  currentEntry,
  entries,
  habits,
  canNext,
  onNavigate,
  onJump,
  onPatch,
  onToggleHabit,
  paperSound,
  onToggleSound,
}: DiaryBookProps) {
  const isMobile = useIsMobile();
  const [turn, setTurn] = useState<Turn>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const turnRef = useRef<Turn>(null);
  const rafRef = useRef<number | null>(null);
  const landedRef = useRef(false);
  const dragRef = useRef({
    active: false,
    startX: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    edge: "" as "left" | "right",
    dir: null as Dir | null,
    width: 0,
  });
  const spreadRef = useRef<HTMLDivElement | null>(null);

  const applyTurn = useCallback((t: Turn) => {
    turnRef.current = t;
    setTurn(t);
  }, []);

  const prevKey = addDaysKey(currentKey, -1);
  const nextKey = addDaysKey(currentKey, 1);
  const prevEntry: DiaryEntry = entries[prevKey] ?? { ...emptyFor(prevKey) };
  const nextEntry: DiaryEntry = entries[nextKey] ?? { ...emptyFor(nextKey) };

  const streak = computeStreak(entries, habits, currentKey, false);
  const stats = habitStats(habits, currentEntry);
  // Only today's page is editable — past pages are read-only (a real diary
  // keeps history intact), and future days can't be reached anyway.
  const isToday = currentKey === todayKey();

  const playRustle = useCallback(
    (intensity: number) => {
      if (paperSound) paperAudio.rustle(intensity);
    },
    [paperSound]
  );

  const animateTo = useCallback(
    (dir: Dir, target: number, onDone: () => void) => {
      const start = turnRef.current?.progress ?? (target === 1 ? 0 : 1);
      const startT = performance.now();
      const dur = target === 1 ? 460 : 360;
      landedRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const tick = (now: number) => {
        const t = clamp((now - startT) / dur, 0, 1);
        const eased = easeInOut(t);
        const progress = start + (target - start) * eased;
        applyTurn({ dir, progress });
        if (target === 1 && progress > 0.55 && !landedRef.current) {
          landedRef.current = true;
          playRustle(0.42);
        }
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          onDone();
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [applyTurn, playRustle]
  );

  const beginTurn = useCallback(
    (dir: Dir) => {
      if (turnRef.current) return;
      if (dir === "next" && !canNext) return;
      applyTurn({ dir, progress: 0 });
      playRustle(0.32);
      animateTo(dir, 1, () => {
        onNavigate(dir);
        applyTurn(null);
      });
    },
    [applyTurn, animateTo, canNext, onNavigate, playRustle]
  );

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
      if (typing) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        beginTurn("next");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        beginTurn("prev");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [beginTurn]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // ---- Pointer / drag handling ----
  const onPointerDown = (e: React.PointerEvent, edge: "left" | "right") => {
    if (turnRef.current) return;
    e.preventDefault();
    const rect = spreadRef.current?.getBoundingClientRect();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      lastX: e.clientX,
      lastT: performance.now(),
      velocity: 0,
      edge,
      dir: null,
      width: rect?.width ?? 600,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const adx = Math.abs(dx);
    if (!d.dir) {
      if (adx < 8) return;
      if (d.edge === "right" && dx < 0 && canNext) d.dir = "next";
      else if (d.edge === "left" && dx > 0) d.dir = "prev";
      else return;
      playRustle(0.28);
    }
    const raw = adx / (d.width * 0.55);
    const progress = clamp(raw, 0, 1);
    const now = performance.now();
    const dt = now - d.lastT;
    if (dt > 0) d.velocity = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = now;
    applyTurn({ dir: d.dir, progress });
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    const t = turnRef.current;
    if (!t) return;
    const dir = t.dir;
    const velInDir = dir === "next" ? -d.velocity : d.velocity;
    const complete = t.progress >= 0.5 || velInDir > 0.45;
    if (complete) {
      animateTo(dir, 1, () => {
        onNavigate(dir);
        applyTurn(null);
      });
    } else {
      animateTo(dir, 0, () => applyTurn(null));
    }
  };

  const onText = (key: string) => (field: keyof DiaryEntry, value: string) =>
    onPatch(key, field, value);

  // ---- Render helpers ----
  const renderLeft = (entry: DiaryEntry, interactive: boolean) => (
    <LeftPageContent
      entry={entry}
      habits={habits}
      stats={habitStats(habits, entry)}
      streak={computeStreak(entries, habits, entry.date, false)}
      interactive={interactive}
      onToggle={(id) => onToggleHabit(entry.date, id)}
      onText={onText(entry.date)}
    />
  );

  const renderRight = (entry: DiaryEntry, interactive: boolean) => (
    <RightPageContent
      entry={entry}
      interactive={interactive}
      onText={onText(entry.date)}
    />
  );

  const renderSingle = (entry: DiaryEntry, interactive: boolean) => (
    <SinglePageContent
      entry={entry}
      habits={habits}
      stats={habitStats(habits, entry)}
      streak={computeStreak(entries, habits, entry.date, false)}
      interactive={interactive}
      onToggle={(id) => onToggleHabit(entry.date, id)}
      onText={onText(entry.date)}
    />
  );

  // Mobile: normal flow, tall page. Desktop: height is driven by the leftover
  // flex space and the width follows the aspect ratio, so the book always fits
  // inside the viewport and the page never needs to scroll.
  const spreadStyle: React.CSSProperties = isMobile
    ? { minHeight: "78vh", width: "100%", transformStyle: "preserve-3d" }
    : {
        // Height comes from the leftover flex space; width follows the ratio.
        // A WIDER ratio therefore means a physically larger book.
        height: "100%",
        width: "auto",
        maxWidth: "min(1500px, 100%)",
        aspectRatio: "1.6 / 1",
        transformStyle: "preserve-3d",
      };

  const turning = !!turn;
  const isNext = turn?.dir === "next";
  const angle = turn ? (isNext ? -1 : 1) * 180 * turn.progress : 0;

  const stripHandlers = (edge: "left" | "right") => ({
    onPointerDown: (e: React.PointerEvent) => onPointerDown(e, edge),
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  });

  return (
    <div className={`diary-stage ${isMobile ? "" : "flex min-h-0 flex-1 flex-col"}`}>
      <div
        className={`book ${isMobile ? "" : "book-fit"}`}
        style={{ perspective: "2200px" }}
      >
        <div ref={spreadRef} className="spread" style={spreadStyle}>
          {/* gutter */}
          {!isMobile && <div className="spread-gutter" />}

          {turn === null ? (
            /* RESTING: current page(s) — editable only if it's today */
            isMobile ? (
              <PageShell side="single">{renderSingle(currentEntry, isToday)}</PageShell>
            ) : (
              <div className="absolute inset-0 flex">
                <div className="h-full w-1/2">
                  <PageShell side="left">{renderLeft(currentEntry, isToday)}</PageShell>
                </div>
                <div className="h-full w-1/2">
                  <PageShell side="right">{renderRight(currentEntry, isToday)}</PageShell>
                </div>
              </div>
            )
          ) : isMobile ? (
            /* SINGLE-PAGE FLIP */
            <>
              {/* base: target */}
              <div className="absolute inset-0" style={{ zIndex: 5 }}>
                <PageShell side="single">{renderSingle(isNext ? nextEntry : prevEntry, false)}</PageShell>
              </div>
              {/* turning page */}
              <div
                className="absolute top-0 h-full w-full preserve-3d"
                style={{
                  left: 0,
                  zIndex: 20,
                  transformOrigin: isNext ? "left center" : "right center",
                  transform: `rotateY(${angle}deg)`,
                }}
              >
                <div className="absolute inset-0 backface-hidden">
                  <PageShell side="single">{renderSingle(currentEntry, false)}</PageShell>
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(0,0,0,0.5), transparent 60%)",
                      opacity: turn.progress * 0.8,
                    }}
                  />
                </div>
                <div
                  className="absolute inset-0 backface-hidden diary-page grain single"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <div className="relative z-[2] h-full p-6 md:p-7">
                    <div className="flex h-full items-center justify-center">
                      <span className="font-serif text-2xl italic text-silver-700">
                        {relativeDay(isNext ? nextKey : prevKey)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* TWO-PAGE SPREAD FLIP */
            <>
              {/* base: target both pages */}
              <div className="absolute inset-0 flex" style={{ zIndex: 5 }}>
                <div className="h-full w-1/2">
                  <PageShell side="left">{renderLeft(isNext ? nextEntry : prevEntry, false)}</PageShell>
                </div>
                <div className="h-full w-1/2">
                  <PageShell side="right">{renderRight(isNext ? nextEntry : prevEntry, false)}</PageShell>
                </div>
              </div>

              {/* static current side */}
              {isNext ? (
                <div className="absolute left-0 top-0 h-full w-1/2" style={{ zIndex: 12 }}>
                  <PageShell side="left">{renderLeft(currentEntry, false)}</PageShell>
                </div>
              ) : (
                <div className="absolute top-0 h-full w-1/2" style={{ left: "50%", zIndex: 12 }}>
                  <PageShell side="right">{renderRight(currentEntry, false)}</PageShell>
                </div>
              )}

              {/* turning page */}
              <div
                className="absolute top-0 h-full w-1/2 preserve-3d"
                style={{
                  left: isNext ? "50%" : "0%",
                  zIndex: 20,
                  transformOrigin: isNext ? "left center" : "right center",
                  transform: `rotateY(${angle}deg)`,
                }}
              >
                <div className="absolute inset-0 backface-hidden">
                  <PageShell side={isNext ? "right" : "left"}>
                    {isNext ? renderRight(currentEntry, false) : renderLeft(currentEntry, false)}
                  </PageShell>
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: isNext
                        ? "linear-gradient(90deg, rgba(0,0,0,0.5), transparent 55%)"
                        : "linear-gradient(270deg, rgba(0,0,0,0.5), transparent 55%)",
                      opacity: turn.progress * 0.85,
                    }}
                  />
                </div>
                <div className="absolute inset-0 backface-hidden" style={{ transform: "rotateY(180deg)" }}>
                  <PageShell side={isNext ? "left" : "right"}>
                    {isNext ? renderLeft(nextEntry, false) : renderRight(prevEntry, false)}
                  </PageShell>
                </div>
              </div>

              {/* cast shadow onto base as page lifts */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  zIndex: 11,
                  background: isNext
                    ? "linear-gradient(90deg, rgba(0,0,0,0.35), transparent 35%)"
                    : "linear-gradient(270deg, rgba(0,0,0,0.35), transparent 35%)",
                  opacity: turn.progress * 0.6,
                }}
              />
            </>
          )}

          {/* drag strips — grab the outer edge to turn the page */}
          <div
            {...stripHandlers("left")}
            className="group absolute left-0 top-0 z-30 h-full w-9 cursor-ew-resize select-none"
            style={{ touchAction: "none" }}
          >
            <div className="absolute left-1.5 top-1/2 h-14 w-[3px] -translate-y-1/2 rounded-full bg-white/0 transition group-hover:bg-amethyst-300/40" />
          </div>
          <div
            {...stripHandlers("right")}
            className="group absolute right-0 top-0 z-30 h-full w-9 cursor-ew-resize select-none"
            style={{ touchAction: "none" }}
          >
            <div className="absolute right-1.5 top-1/2 h-14 w-[3px] -translate-y-1/2 rounded-full bg-white/0 transition group-hover:bg-amethyst-300/40" />
          </div>

        </div>
      </div>

      {/* Controls */}
      <div className="mx-auto mt-4 flex max-w-3xl shrink-0 flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:mt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => beginTurn("prev")}
            disabled={turning}
            className="press group/nav inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-silver-400 hover:-translate-y-0.5 hover:border-amethyst-400/40 hover:text-amethyst-200 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="transition-transform duration-300 group-hover/nav:-translate-x-0.5"
            >
              <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Previous
          </button>

          <button
            onClick={() => onJump(todayKey())}
            disabled={currentKey === todayKey()}
            className="press rounded-full border border-white/10 px-5 py-2 text-xs font-medium uppercase tracking-[0.16em] text-silver-200 hover:-translate-y-0.5 hover:border-amethyst-400/40 hover:text-amethyst-100 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            Today
          </button>

          <button
            onClick={() => beginTurn("next")}
            disabled={turning || !canNext}
            className="press group/nav inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-silver-400 hover:-translate-y-0.5 hover:border-amethyst-400/40 hover:text-amethyst-200 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            Next
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="transition-transform duration-300 group-hover/nav:translate-x-0.5"
            >
              <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4 text-silver-600">
          <button
            onClick={() => setCalendarOpen(true)}
            className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.18em] transition hover:text-amethyst-200"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 9h18M8 3v4M16 3v4" strokeLinecap="round" />
            </svg>
            {formatLong(currentKey).replace(/, \d{4}$/, "")}
          </button>

          <button
            onClick={onToggleSound}
            className="inline-flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.18em] transition hover:text-amethyst-200"
            title="Toggle paper sound"
          >
            {paperSound ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8 8 0 0 1 0 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
                <path d="m22 9-6 6M16 9l6 6" strokeLinecap="round" />
              </svg>
            )}
            {paperSound ? "Sound on" : "Muted"}
          </button>
        </div>


      </div>

      <DiaryCalendar
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        entries={entries}
        selected={currentKey}
        onPick={(key) => {
          if (!isFutureKey(key)) onJump(key);
        }}
      />
    </div>
  );
}

function emptyFor(date: string): DiaryEntry {
  return {
    date,
    completions: {},
    todaysThoughts: "",
    accomplished: "",
    learned: "",
    improve: "",
    tomorrowMission: "",
    notes: "",
    updatedAt: undefined,
  };
}




