"use client";

import { useMemo, useState } from "react";
import {
  useStore,
  balanceTotal,
  balanceBase,
  transactionsNet,
  type AssetTx,
  type AssetTxKind,
} from "@/lib/store";
import { GlassCard, Ring, SectionLabel } from "@/components/ui";
import { uid } from "@/lib/id";
import { formatMoney, maskMoney } from "@/lib/format";
import { formatMedium, formatShort, todayKey, parseKey } from "@/lib/date";

/** Catmull-Rom → cubic bezier, for a smooth flowing growth curve. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.22;
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/** Compact axis label: 1.2L / 45K / 900 */
function compact(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`;
  if (a >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  if (a >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(Math.round(n));
}

export default function AssetPage() {
  const { balance, setBalance, settings, setSettings } = useStore();
  const sym = settings.currencySymbol;
  const hidden = !!settings.hideBalance;
  const toggleHidden = () => setSettings((s) => ({ ...s, hideBalance: !s.hideBalance }));
  const money = (n: number) => (hidden ? maskMoney(sym) : formatMoney(n, sym));

  const base = balanceBase(balance);
  const net = transactionsNet(balance);
  const total = balanceTotal(balance);

  const [baseDraft, setBaseDraft] = useState<string | null>(null);
  const [goalDraft, setGoalDraft] = useState<string | null>(null);
  const [kind, setKind] = useState<AssetTxKind>("spending");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayKey());

  const txs = useMemo(
    () =>
      [...(balance.transactions ?? [])].sort((a, b) =>
        b.date === a.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)
      ),
    [balance.transactions]
  );

  const earned = useMemo(
    () => txs.filter((t) => t.kind === "earning").reduce((s, t) => s + t.amount, 0),
    [txs]
  );
  const spent = useMemo(
    () => txs.filter((t) => t.kind === "spending").reduce((s, t) => s + t.amount, 0),
    [txs]
  );

  // ── Growth series: walk history chronologically from the base amount ──
  const series = useMemo(() => {
    const ascending = [...(balance.transactions ?? [])].sort((a, b) =>
      a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)
    );
    const pts: { date: string; value: number }[] = [];
    let running = base;
    const startDate = ascending[0]?.date ?? todayKey();
    pts.push({ date: startDate, value: base });
    for (const t of ascending) {
      running += (t.kind === "earning" ? 1 : -1) * (Number(t.amount) || 0);
      pts.push({ date: t.date, value: running });
    }
    return pts;
  }, [balance.transactions, base]);

  const commitBase = (value: string) => {
    const n = Number(value);
    setBalance((b) => ({
      ...b,
      baseAmount: Number.isFinite(n) ? n : 0,
      lastUpdated: new Date().toISOString(),
    }));
    setBaseDraft(null);
  };

  const commitGoal = (value: string) => {
    const n = Number(value);
    setBalance((b) => ({
      ...b,
      savingsGoal: Number.isFinite(n) && n > 0 ? n : undefined,
    }));
    setGoalDraft(null);
  };

  const addTx = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    const tx: AssetTx = {
      id: uid(),
      kind,
      amount: n,
      note: note.trim(),
      date: date || todayKey(),
      createdAt: new Date().toISOString(),
    };
    setBalance((b) => ({
      ...b,
      baseAmount: typeof b.baseAmount === "number" ? b.baseAmount : base,
      transactions: [tx, ...(b.transactions ?? [])],
      lastUpdated: new Date().toISOString(),
    }));
    setAmount("");
    setNote("");
  };

  const removeTx = (id: string) =>
    setBalance((b) => ({
      ...b,
      transactions: (b.transactions ?? []).filter((t) => t.id !== id),
      lastUpdated: new Date().toISOString(),
    }));

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-silver-100 placeholder:text-silver-600 outline-none transition-colors duration-200 focus:border-amethyst-400/40";

  // ── Chart geometry (time-proportional X) ──
  const W = 1000;
  const H = 260;
  const padL = 54;
  const padR = 16;
  const padT = 18;
  const padB = 30;

  const chart = useMemo(() => {
    if (series.length < 2) return null;
    const values = series.map((p) => p.value);
    let hi = Math.max(...values);
    let lo = Math.min(...values);
    if (hi === lo) {
      hi += Math.abs(hi) * 0.1 || 1;
      lo -= Math.abs(lo) * 0.1 || 1;
    }
    const pad = (hi - lo) * 0.12;
    hi += pad;
    lo -= pad;

    const t0 = parseKey(series[0].date).getTime();
    const t1 = parseKey(series[series.length - 1].date).getTime();
    const tSpan = t1 - t0;

    const pts = series.map((p, i) => {
      const frac =
        tSpan > 0
          ? (parseKey(p.date).getTime() - t0) / tSpan
          : i / Math.max(1, series.length - 1);
      return {
        x: padL + frac * (W - padL - padR),
        y: padT + (1 - (p.value - lo) / (hi - lo)) * (H - padT - padB),
        value: p.value,
        date: p.date,
      };
    });

    const gridVals = [0, 0.25, 0.5, 0.75, 1].map((g) => lo + (hi - lo) * (1 - g));
    return { pts, hi, lo, gridVals };
  }, [series]);

  const growth = total - base;
  const growthPct = base !== 0 ? (growth / Math.abs(base)) * 100 : 0;
  const peak = series.length ? Math.max(...series.map((p) => p.value)) : base;

  const goal = balance.savingsGoal;
  const goalPct = goal && goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : null;

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* ── Header ── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Asset</SectionLabel>
          <h1 className="mt-2 font-serif text-[clamp(2rem,4.5vw,3rem)] font-medium text-silver-50">
            Your wealth
          </h1>
        </div>
        <button
          type="button"
          onClick={toggleHidden}
          className="press inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[0.64rem] uppercase tracking-[0.16em] text-silver-400 transition hover:border-white/25 hover:text-silver-200"
        >
          {hidden ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
              <path d="M9.9 5.1A10.6 10.6 0 0 1 12 5c7 0 10 7 10 7a18.5 18.5 0 0 1-3.2 4.1" />
              <path d="M6.1 6.1C3.8 7.8 2 12 2 12s3 7 10 7a9.8 9.8 0 0 0 4.1-.9" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
          {hidden ? "Show balance" : "Hide balance"}
        </button>
      </header>

      {/* ── Growth card ── */}
      <GlassCard className="relative mt-6 overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-amethyst-500/[0.16] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-emerald-500/[0.05] blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <SectionLabel>Total asset</SectionLabel>
              <div className="mt-2 font-serif text-[clamp(2.5rem,6vw,3.8rem)] leading-none tracking-tight text-silver-50">
                {money(total)}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                    growth >= 0
                      ? "bg-emerald-400/10 text-emerald-300/95"
                      : "bg-red-400/10 text-red-300/95"
                  }`}
                >
                  {growth >= 0 ? "▲" : "▼"} {money(Math.abs(growth))}
                  {base !== 0 && !hidden && (
                    <span className="opacity-70">({growthPct >= 0 ? "+" : ""}{growthPct.toFixed(1)}%)</span>
                  )}
                </span>
                <span className="text-silver-600">since base of {money(base)}</span>
              </div>
            </div>

            {/* base editor */}
            <div className="w-full sm:w-52">
              <label className="mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-silver-500">
                Base balance
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 transition-all duration-300 focus-within:border-amethyst-400/50 focus-within:ring-2 focus-within:ring-amethyst-500/15">
                <span className="text-silver-400">{sym}</span>
                {hidden ? (
                  <span className="w-full text-right font-serif text-lg tracking-widest text-silver-300">••••••</span>
                ) : (
                  <input
                    type="number"
                    inputMode="decimal"
                    value={baseDraft ?? String(base)}
                    onChange={(e) => setBaseDraft(e.target.value)}
                    onBlur={(e) => commitBase(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    className="w-full bg-transparent text-right font-serif text-lg text-silver-100 outline-none"
                  />
                )}
              </div>
              <p className="mt-1.5 text-[0.62rem] text-silver-600">Saves instantly.</p>
            </div>
          </div>

          {/* ── Growth chart ── */}
          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[0.62rem] uppercase tracking-[0.2em] text-silver-500">
                Asset growth
              </span>
              {chart && (
                <span className="text-[0.62rem] text-silver-600">
                  Peak {hidden ? "••••" : `${sym}${compact(peak)}`}
                </span>
              )}
            </div>

            {chart ? (
              <>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Asset growth chart">
                  <defs>
                    <linearGradient id="growthArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#9788db" stopOpacity="0.38" />
                      <stop offset="1" stopColor="#9788db" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="growthLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#6353a8" />
                      <stop offset="0.55" stopColor="#9788db" />
                      <stop offset="1" stopColor="#cfc6f5" />
                    </linearGradient>
                    <filter id="growthGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="6" result="b" />
                      <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* grid + Y labels */}
                  {chart.gridVals.map((v, i) => {
                    const y = padT + (i / 4) * (H - padT - padB);
                    return (
                      <g key={i}>
                        <line
                          x1={padL}
                          x2={W - padR}
                          y1={y}
                          y2={y}
                          stroke="rgba(255,255,255,0.055)"
                          strokeWidth="1"
                        />
                        <text
                          x={padL - 10}
                          y={y + 3.5}
                          textAnchor="end"
                          fontSize="10"
                          fill="rgba(255,255,255,0.3)"
                        >
                          {hidden ? "•••" : compact(v)}
                        </text>
                      </g>
                    );
                  })}

                  {/* area + line */}
                  <path
                    d={`${smoothPath(chart.pts)} L ${chart.pts[chart.pts.length - 1].x.toFixed(2)} ${H - padB} L ${chart.pts[0].x.toFixed(2)} ${H - padB} Z`}
                    fill="url(#growthArea)"
                  />
                  <path
                    d={smoothPath(chart.pts)}
                    fill="none"
                    stroke="url(#growthLine)"
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#growthGlow)"
                  />

                  {/* current point */}
                  {(() => {
                    const last = chart.pts[chart.pts.length - 1];
                    return (
                      <g>
                        <circle cx={last.x} cy={last.y} r="9" fill="#b3a6ea" opacity="0.18" />
                        <circle cx={last.x} cy={last.y} r="4.5" fill="#cfc6f5" stroke="#07070b" strokeWidth="2" />
                      </g>
                    );
                  })()}

                  {/* X labels */}
                  <text x={padL} y={H - 8} fontSize="10" fill="rgba(255,255,255,0.3)">
                    {formatShort(series[0].date)}
                  </text>
                  <text x={W - padR} y={H - 8} fontSize="10" textAnchor="end" fill="rgba(255,255,255,0.3)">
                    {formatShort(series[series.length - 1].date)}
                  </text>
                </svg>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
                <p className="font-serif text-lg text-silver-400">Your growth curve appears here</p>
                <p className="mt-1 text-sm text-silver-600">
                  Add an earning or spending below to start plotting.
                </p>
              </div>
            )}
          </div>

          {/* stat chips */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="glass-soft rounded-xl px-4 py-3 transition-transform duration-300 hover:-translate-y-0.5">
              <div className="flex items-center gap-2 text-[0.6rem] uppercase tracking-widest text-silver-600">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-400/15 text-[0.68rem] text-emerald-300">▲</span>
                Earned
              </div>
              <div className="mt-1 font-serif text-xl text-emerald-300/95">+{money(earned)}</div>
            </div>
            <div className="glass-soft rounded-xl px-4 py-3 transition-transform duration-300 hover:-translate-y-0.5">
              <div className="flex items-center gap-2 text-[0.6rem] uppercase tracking-widest text-silver-600">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-red-400/15 text-[0.68rem] text-red-300">▼</span>
                Spent
              </div>
              <div className="mt-1 font-serif text-xl text-red-300/90">−{money(spent)}</div>
            </div>
            <div className="glass-soft col-span-2 rounded-xl px-4 py-3 transition-transform duration-300 hover:-translate-y-0.5 sm:col-span-1">
              <div className="flex items-center gap-2 text-[0.6rem] uppercase tracking-widest text-silver-600">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-amethyst-400/15 text-[0.68rem] text-amethyst-200">∑</span>
                Net
              </div>
              <div
                className={`mt-1 font-serif text-xl ${
                  net >= 0 ? "text-emerald-300/95" : "text-red-300/90"
                }`}
              >
                {net >= 0 ? "+" : "−"}{money(Math.abs(net))}
              </div>
            </div>
          </div>

          {/* ── Savings goal ── */}
          <div className="mt-6 glass-soft rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                {goalPct !== null && (
                  <Ring value={goalPct} size={80} stroke={7}>
                    <div className="text-center">
                      <div className="font-serif text-lg leading-none text-silver-100">{goalPct}%</div>
                      <div className="mt-0.5 text-[0.5rem] uppercase tracking-widest text-silver-600">of goal</div>
                    </div>
                  </Ring>
                )}
                <div className="min-w-0">
                  <div className="text-[0.62rem] font-medium uppercase tracking-[0.18em] text-silver-500">
                    Savings goal
                  </div>
                  {goal && !hidden ? (
                    <div className="mt-1 font-serif text-2xl text-silver-100">{money(goal)}</div>
                  ) : !goal ? (
                    <p className="mt-1 text-sm text-silver-500">Set a target to track your progress.</p>
                  ) : (
                    <div className="mt-1 font-serif text-2xl tracking-widest text-silver-300">••••••</div>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-44">
                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 transition-all duration-300 focus-within:border-amethyst-400/50 focus-within:ring-2 focus-within:ring-amethyst-500/15">
                  <span className="text-silver-400">{sym}</span>
                  {hidden ? (
                    <span className="w-full text-right font-serif text-lg tracking-widest text-silver-300">••••••</span>
                  ) : (
                    <input
                      type="number"
                      inputMode="decimal"
                      value={goalDraft ?? String(goal ?? "")}
                      onChange={(e) => setGoalDraft(e.target.value)}
                      onBlur={(e) => commitGoal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                      placeholder="e.g. 100000"
                      className="w-full bg-transparent text-right font-serif text-lg text-silver-100 outline-none placeholder:text-silver-700"
                    />
                  )}
                </div>
                <p className="mt-1.5 text-[0.62rem] text-silver-600">Your savings target.</p>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── History ── */}
      <GlassCard className="mt-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <SectionLabel>History</SectionLabel>
            <p className="mt-1 text-sm text-silver-500">
              Every entry adds to or subtracts from your total.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-silver-500">
            {txs.length} entr{txs.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {/* Add form */}
        <form onSubmit={addTx} className="mt-5 space-y-3">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {(["spending", "earning"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`press rounded-lg px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition-all duration-300 ${
                  kind === k
                    ? k === "earning"
                      ? "bg-emerald-400/15 text-emerald-200 shadow-[0_0_20px_-6px_rgba(52,211,153,0.4)]"
                      : "bg-red-400/15 text-red-200 shadow-[0_0_20px_-6px_rgba(248,113,113,0.4)]"
                    : "text-silver-500 hover:text-silver-300"
                }`}
              >
                {k === "earning" ? "▲ Earning" : "▼ Spending"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.6fr_auto_auto]">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={sym ? `${sym} amount` : "Amount"}
              className={inputCls}
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note — groceries, salary, rent…"
              className={inputCls}
            />
            <input
              type="date"
              value={date}
              max={todayKey()}
              onChange={(e) => setDate(e.target.value)}
              className={`${inputCls} sm:w-[150px]`}
            />
            <button
              type="submit"
              disabled={!amount || Number(amount) <= 0}
              className={`press shrink-0 rounded-xl border px-6 py-2.5 text-sm font-medium transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
                kind === "earning"
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:-translate-y-0.5 hover:bg-emerald-400/20 hover:shadow-[0_10px_30px_-10px_rgba(52,211,153,0.4)]"
                  : "border-red-400/30 bg-red-400/10 text-red-200 hover:-translate-y-0.5 hover:bg-red-400/20 hover:shadow-[0_10px_30px_-10px_rgba(248,113,113,0.4)]"
              } disabled:hover:translate-y-0`}
            >
              Add
            </button>
          </div>
        </form>

        {/* List */}
        <div className="mt-5 space-y-2">
          {txs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-5 py-10 text-center">
              <p className="font-serif text-lg text-silver-400">No history yet</p>
              <p className="mt-1 text-sm text-silver-600">
                Add your first earning or spending above.
              </p>
            </div>
          ) : (
            txs.map((t) => {
              const isEarn = t.kind === "earning";
              return (
                <div
                  key={t.id}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.04]"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-sm transition-transform duration-300 group-hover:scale-105 ${
                      isEarn
                        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                        : "border-red-400/25 bg-red-400/10 text-red-300"
                    }`}
                  >
                    {isEarn ? "▲" : "▼"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-silver-200">
                      {t.note || (isEarn ? "Earning" : "Spending")}
                    </p>
                    <p className="mt-0.5 text-[0.66rem] uppercase tracking-[0.14em] text-silver-600">
                      {formatMedium(t.date)}
                    </p>
                  </div>

                  <div
                    className={`shrink-0 font-serif text-lg transition-transform duration-300 group-hover:scale-[1.03] ${
                      isEarn ? "text-emerald-300/90" : "text-red-300/85"
                    }`}
                  >
                    {isEarn ? "+" : "−"}
                    {money(t.amount)}
                  </div>

                  <button
                    onClick={() => removeTx(t.id)}
                    className="press grid h-8 w-8 shrink-0 place-items-center rounded-lg text-silver-700 opacity-0 transition-all duration-300 hover:text-red-300/80 group-hover:opacity-100"
                    aria-label="Delete entry"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>
    </div>
  );
}
