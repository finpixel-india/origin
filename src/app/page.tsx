"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStore, habitStats, computeStreak, balanceTotal } from "@/lib/store";
import { greetingFor, timeFor, formatLong, todayKey, formatShort } from "@/lib/date";
import { motivationFor } from "@/lib/motivational";
import { formatMoney, maskMoney } from "@/lib/format";
import { Badge, GlassCard, Progress, SectionLabel, badgeTone } from "@/components/ui";
import { uid } from "@/lib/id";

function EmptyPrompt({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex min-h-[108px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-5 text-center transition-colors group-hover:border-white/20 group-hover:bg-white/[0.04]">
      <p className="font-serif text-[1.05rem] text-silver-300">{title}</p>
      <p className="mt-1 max-w-[18rem] text-xs leading-relaxed text-silver-600">{detail}</p>
      <span className="mt-2 text-[0.62rem] uppercase tracking-[0.2em] text-silver-500">
        Open <span className="arrow-shift">→</span>
      </span>
    </div>
  );
}

export default function HomePage() {
  const { settings, habits, entries, getEntry, focus, setFocus, bucket, projects, balance } = useStore();

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const today = todayKey();
  const todayEntry = getEntry(today);
  const activeHabits = habits.filter((h) => !h.archived);
  const stats = habitStats(habits, todayEntry);
  const streak = useMemo(() => computeStreak(entries, habits, today, false), [entries, habits, today]);
  const hasHabitData = activeHabits.length > 0;

  const latestEntry = useMemo(() => {
    const keys = Object.keys(entries).sort();
    for (let i = keys.length - 1; i >= 0; i--) {
      const e = entries[keys[i]];
      const text = e.accomplished || e.todaysThoughts;
      if (text && text.trim()) return e;
    }
    return null;
  }, [entries]);

  const totalBalance = balanceTotal(balance);
  const hasBalanceData =
    typeof balance.baseAmount === "number" ||
    (balance.transactions?.length ?? 0) > 0 ||
    balance.accounts.length > 0;
  const recentTx = useMemo(
    () =>
      [...(balance.transactions ?? [])]
        .sort((a, b) =>
          b.date === a.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)
        )
        .slice(0, 3),
    [balance.transactions]
  );

  const hasBucketData = bucket.length > 0;
  const bucketStats = useMemo(() => {
    const completed = bucket.filter((b) => b.status === "Completed").length;
    const inProgress = bucket.filter((b) => b.status === "In Progress").length;
    const overall = bucket.length > 0 ? Math.round(bucket.reduce((s, b) => s + b.progress, 0) / bucket.length) : null;
    return { completed, inProgress, overall, total: bucket.length };
  }, [bucket]);

  const hasProjectData = projects.length > 0;
  const visibleProjects = projects.slice(0, 3);

  const toggleFocus = (id: string) => setFocus((prev) => prev.map((f) => (f.id === id ? { ...f, done: !f.done } : f)));
  const addFocus = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setFocus((prev) => [...prev, { id: uid(), text: t, done: false }]);
  };
  const removeFocus = (id: string) => setFocus((prev) => prev.filter((f) => f.id !== id));

  const motivation = motivationFor(today, settings.motivations);
  const greeting = now ? greetingFor(now) : "Good morning";
  const sym = settings.currencySymbol;
  const hideMoney = !!settings.hideBalance;
  const money = (n: number) => (hideMoney ? maskMoney(sym) : formatMoney(n, sym));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col lg:h-[calc(100vh-5.5rem)] lg:min-h-0">
      {/* Header */}
      <header className="shrink-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <SectionLabel>{now ? formatLong(today) : ""}</SectionLabel>
          {now && <span className="font-serif text-sm italic text-silver-600">{timeFor(now)}</span>}
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-[clamp(1.9rem,5vw,2.9rem)] font-medium leading-[1.02] text-silver-50">
              {greeting}{settings.name ? <>, <span className="text-silver-200">{settings.name}</span></> : null}.
            </h1>
            <p className="mt-1.5 max-w-2xl font-serif text-[1.05rem] italic leading-snug text-silver-400">{motivation}</p>
          </div>
          <Link href="/diary" prefetch={true} className="group hidden shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[0.66rem] uppercase tracking-[0.18em] text-silver-400 transition hover:border-white/20 hover:text-silver-200 sm:inline-flex">
            Open diary <span className="arrow-shift ml-1">→</span>
          </Link>
        </div>
      </header>

      {/* Main grid — fits the desktop viewport height (no page scroll) */}
      <div className="mt-5 grid min-h-0 flex-1 grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-12 xl:grid-rows-[minmax(0,1fr)_minmax(0,0.9fr)] xl:overflow-hidden">
        {/* Habit */}
        <Link href={hasHabitData ? "/diary" : "/settings"} prefetch={true} className="md:col-span-1 xl:col-span-4 xl:min-h-0">
          <GlassCard className="group lift flex h-full min-h-[168px] flex-col p-5 xl:min-h-0">
            <div className="flex items-center justify-between gap-2">
              <SectionLabel>Today&apos;s Ritual</SectionLabel>
              <span className="shrink-0 text-[0.62rem] uppercase tracking-[0.18em] text-silver-600 transition-colors group-hover:text-silver-300">
                {hasHabitData ? <>Diary <span className="arrow-shift">→</span></> : <>Add habits <span className="arrow-shift">→</span></>}
              </span>
            </div>
            {hasHabitData ? (
              <div className="mt-5 flex flex-1 items-center gap-5">
                <div className="grid h-[84px] w-[84px] shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
                  <div className="text-center">
                    <div className="font-serif text-2xl text-silver-100">{stats.pct}%</div>
                    <div className="text-[0.58rem] uppercase tracking-widest text-silver-600">done</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-3xl text-silver-100">
                    {stats.done}<span className="text-silver-600">/{stats.total}</span>
                  </div>
                  <p className="text-xs text-silver-500">completed today</p>
                  <div className="mt-3 flex items-center gap-2 text-sm text-silver-400">
                    <span>🔥</span>
                    <span><span className="font-medium text-silver-200">{streak}</span> day streak</span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyPrompt title="No rituals yet" detail="Create the habits you actually want to live by." />
            )}
          </GlassCard>
        </Link>

        {/* Priorities */}
        <GlassCard className="flex min-h-[220px] flex-col p-5 md:col-span-1 xl:col-span-5 xl:min-h-0">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Today&apos;s Priorities</SectionLabel>
            {focus.length > 0 && (
              <span className="shrink-0 text-[0.62rem] uppercase tracking-[0.18em] text-silver-600">
                {focus.filter((f) => f.done).length}/{focus.length} done
              </span>
            )}
          </div>

          <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
            {focus.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center font-serif text-base text-silver-500">
                Nothing on the table. Choose what matters today.
              </p>
            ) : (
              focus.map((f) => (
                <div key={f.id} className="group row-hover flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.04]">
                  <button
                    onClick={() => toggleFocus(f.id)}
                    className={`press grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all duration-300 ${f.done ? "border-white/20 bg-white/10 text-silver-200" : "border-white/15 text-transparent hover:border-white/30"}`}
                    aria-label="toggle"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className={`transition-transform duration-300 ${f.done ? "scale-100" : "scale-50"}`}>
                      <path d="m5 12 5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className={`min-w-0 flex-1 break-words text-sm ${f.done ? "text-silver-600 line-through" : "text-silver-200"}`}>{f.text}</span>
                  <button onClick={() => removeFocus(f.id)} className="press shrink-0 text-silver-700 opacity-0 transition hover:text-silver-300 group-hover:opacity-100" aria-label="remove">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const el = e.currentTarget.elements.namedItem("f") as HTMLInputElement;
              addFocus(el.value);
              el.value = "";
            }}
          >
            <input name="f" placeholder="Add a priority…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-silver-100 placeholder:text-silver-600 outline-none focus:border-white/20" />
            <button type="submit" className="press shrink-0 rounded-xl border border-white/10 px-4 text-sm text-silver-300 transition hover:border-white/20 hover:text-silver-100">Add</button>
          </form>
        </GlassCard>

        {/* Latest */}
        <Link href="/diary" prefetch={true} className="md:col-span-2 xl:col-span-3 xl:min-h-0">
          <GlassCard className="group lift flex h-full min-h-[168px] flex-col p-5 xl:min-h-0">
            <div className="flex items-center justify-between">
              <SectionLabel>Latest Entry</SectionLabel>
              <span className="arrow-shift text-[0.62rem] uppercase tracking-[0.18em] text-silver-600 group-hover:text-silver-300">→</span>
            </div>
            {latestEntry ? (
              <>
                <p className="mt-4 line-clamp-4 font-serif text-[1.08rem] leading-snug text-silver-200">{(latestEntry.accomplished || latestEntry.todaysThoughts).slice(0, 160)}</p>
                <p className="mt-auto pt-3 text-xs text-silver-600">{formatLong(latestEntry.date)}</p>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
                <p className="font-serif text-lg text-silver-400">Your diary awaits its first page.</p>
                <span className="mt-2 text-[0.62rem] uppercase tracking-[0.2em] text-silver-600">Write today <span className="arrow-shift">→</span></span>
              </div>
            )}
          </GlassCard>
        </Link>

        {/* Bucket */}
        <Link href="/bucket" prefetch={true} className="md:col-span-1 xl:col-span-4 xl:min-h-0">
          <GlassCard className="group lift flex h-full min-h-[156px] flex-col p-5 xl:min-h-0">
            <div className="flex items-center justify-between">
              <SectionLabel>Bucket List</SectionLabel>
              <span className="arrow-shift text-[0.62rem] uppercase tracking-[0.18em] text-silver-600 group-hover:text-silver-300">→</span>
            </div>
            {hasBucketData && bucketStats.overall !== null ? (
              <>
                <div className="mt-3 flex items-end gap-3">
                  <span className="font-serif text-4xl text-silver-50">{bucketStats.overall}%</span>
                  <span className="pb-1 text-xs text-silver-600">average progress</span>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                  <div className="glass-soft rounded-lg px-3 py-2.5">
                    <div className="font-serif text-xl text-silver-100">{bucketStats.completed}</div>
                    <div className="text-[0.62rem] uppercase tracking-widest text-silver-600">Completed</div>
                  </div>
                  <div className="glass-soft rounded-lg px-3 py-2.5">
                    <div className="font-serif text-xl text-silver-100">{bucketStats.inProgress}</div>
                    <div className="text-[0.62rem] uppercase tracking-widest text-silver-600">In progress</div>
                  </div>
                </div>
              </>
            ) : (
              <EmptyPrompt title="No experiences yet" detail="Collect the future moments you want to live." />
            )}
          </GlassCard>
        </Link>

        {/* Balance */}
        <Link href="/balance" prefetch={true} className="md:col-span-1 xl:col-span-4 xl:min-h-0">
          <GlassCard className="group lift flex h-full min-h-[156px] flex-col p-5 xl:min-h-0">
            <div className="flex items-center justify-between">
              <SectionLabel>Asset</SectionLabel>
              <span className="arrow-shift text-[0.62rem] uppercase tracking-[0.18em] text-silver-600 group-hover:text-silver-300">→</span>
            </div>
            {hasBalanceData ? (
              <>
                <div className="mt-3 font-serif text-[2.1rem] leading-none text-silver-50">{money(totalBalance)}</div>
                <p className="mt-1 text-xs text-silver-600">{balance.lastUpdated ? `Updated ${formatShort(balance.lastUpdated.slice(0, 10))}` : "Manual snapshot"}</p>
                <div className="mt-auto space-y-1.5 pt-3">
                  {recentTx.length === 0 ? (
                    <p className="text-[0.68rem] text-silver-600">No history yet.</p>
                  ) : (
                    recentTx.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-2 text-[0.7rem]">
                        <span className="min-w-0 truncate text-silver-500">
                          {t.note || (t.kind === "earning" ? "Earning" : "Spending")}
                        </span>
                        <span className={t.kind === "earning" ? "shrink-0 text-emerald-300/85" : "shrink-0 text-red-300/80"}>
                          {t.kind === "earning" ? "+" : "−"}{money(t.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <EmptyPrompt title="No asset added" detail="Set your balance and track what you earn and spend." />
            )}
          </GlassCard>
        </Link>

        {/* Work */}
        <Link href="/work" prefetch={true} className="md:col-span-2 xl:col-span-4 xl:min-h-0">
          <GlassCard className="group lift flex h-full min-h-[156px] flex-col p-5 xl:min-h-0">
            <div className="flex items-center justify-between">
              <SectionLabel>Work</SectionLabel>
              <span className="arrow-shift text-[0.62rem] uppercase tracking-[0.18em] text-silver-600 group-hover:text-silver-300">→</span>
            </div>
            {hasProjectData ? (
              <div className="mt-3 space-y-2">
                {visibleProjects.map((p) => (
                  <div key={p.id} className="glass-soft rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-silver-200">{p.name}</p>
                      <Badge tone={badgeTone(p.priority)}>{p.priority}</Badge>
                    </div>
                    <div className="mt-2">
                      <div className="mb-1 flex justify-between text-[0.66rem] text-silver-600">
                        <span>{p.status}</span>
                        <span>{p.progress}%</span>
                      </div>
                      <Progress value={p.progress} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPrompt title="No projects yet" detail="Keep work simple until there is something real to build." />
            )}
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
