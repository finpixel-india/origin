"use client";

import { useEffect, useRef, useState } from "react";
import { useStore, type Habit } from "@/lib/store";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  Button,
  Field,
  GlassCard,
  Modal,
  SectionLabel,
  TextInput,
} from "@/components/ui";
import { uid } from "@/lib/id";
import { DEFAULT_MOTIVATIONS } from "@/lib/motivational";

function timeAgo(ts: number | null): string {
  if (!ts) return "";
  const secs = Math.round((Date.now() - ts) / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

function AuthForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fn = mode === "login" ? login : register;
    const res = await fn(username, password);
    setBusy(false);
    if (!res.ok) setError(res.error || "Something went wrong.");
  };

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-silver-100 placeholder:text-silver-600 outline-none transition-colors focus:border-white/25";

  return (
    <div className="mt-4">
      <p className="text-sm text-silver-500">
        Create an ID &amp; password to save your data and open ORIGIN on any device — phone, laptop,
        anywhere. No email needed.
      </p>

      {/* tabs */}
      <div className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null); }}
            className={`press rounded-lg px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition ${
              mode === m ? "bg-white/10 text-silver-100" : "text-silver-500 hover:text-silver-300"
            }`}
          >
            {m === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-silver-500">
            Your ID
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. ur.spideey"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.16em] text-silver-500">
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className={`${inputCls} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[0.62rem] uppercase tracking-wide text-silver-500 transition hover:text-silver-200"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-400/25 bg-red-400/5 px-3.5 py-2 text-xs text-red-200/85">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="press w-full rounded-xl border border-amethyst-400/35 bg-amethyst-500/15 px-5 py-2.5 text-sm font-medium text-amethyst-100 transition hover:-translate-y-0.5 hover:bg-amethyst-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account & sync"}
        </button>
      </form>

      <p className="mt-3 text-xs text-silver-600">
        {mode === "login"
          ? "New here? Switch to “Create account”."
          : "Already have an ID? Switch to “Sign in”."}
        {" "}Your password is encrypted — it&apos;s never stored in plain text.
      </p>
    </div>
  );
}

const EMOJI_OPTIONS = [
  "🌅","🥷","📖","🎯","🧘","🍃","💧","🏃","💤","✍️",
  "💪","🧠","☀️","🌙","🚭","🎨","🏋️","🥗","🚶","🎵",
  "📝","💊","🧹","🛏️","🫁","🥤","🧘","⚡","🦷","🫶",
];

const ChevronUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 15 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);
const X = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
  </svg>
);

function HabitRow({
  h,
  i,
  total,
  onUpdate,
  onRemove,
  onMove,
}: {
  h: Habit;
  i: number;
  total: number;
  onUpdate: (patch: Partial<Habit>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="group flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] p-2 transition hover:border-white/[0.12]">
      {/* emoji picker */}
      <select
        value={h.emoji}
        onChange={(e) => onUpdate({ emoji: e.target.value })}
        className="shrink-0 cursor-pointer rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-lg outline-none focus:border-amethyst-400/40"
        title="Pick emoji"
      >
        {EMOJI_OPTIONS.map((em) => (
          <option key={em} value={em} className="bg-zinc-900">{em}</option>
        ))}
      </select>

      {/* name */}
      <input
        value={h.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Habit name…"
        className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-silver-200 outline-none transition focus:border-white/10 focus:bg-black/30"
      />

      {/* reorder */}
      <div className="flex shrink-0 flex-col">
        <button
          onClick={() => onMove(-1)}
          disabled={i === 0}
          className="grid h-5 w-6 place-items-center rounded text-silver-600 transition hover:text-silver-200 disabled:opacity-20"
          aria-label="Move up"
        ><ChevronUp /></button>
        <button
          onClick={() => onMove(1)}
          disabled={i === total - 1}
          className="grid h-5 w-6 place-items-center rounded text-silver-600 transition hover:text-silver-200 disabled:opacity-20"
          aria-label="Move down"
        ><ChevronDown /></button>
      </div>

      {/* delete */}
      <button
        onClick={onRemove}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-silver-700 opacity-0 transition hover:text-red-300/80 group-hover:opacity-100"
        aria-label="Remove habit"
      ><X /></button>
    </div>
  );
}

export default function SettingsPage() {
  const {
    settings,
    setSettings,
    habits,
    setHabits,
    exportData,
    importData,
    resetAll,
  } = useStore();

  const { loading: authLoading, user, sync, lastSyncedAt, syncNow, signOut, updateUser } = useAuth();

  const [confirmReset, setConfirmReset] = useState(false);
  const [manualSyncError, setManualSyncError] = useState<string | null>(null);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitEmoji, setNewHabitEmoji] = useState("🎯");
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const picInputRef = useRef<HTMLInputElement | null>(null);

  // Read the ?auth= result from the OAuth redirect, then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const a = params.get("auth");
    if (a) {
      setAuthNotice(a);
      params.delete("auth");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
  }, []);

  const addHabit = () => {
    const name = newHabitName.trim() || "New habit";
    setHabits((prev) => [
      ...prev,
      { id: uid(), name, emoji: newHabitEmoji, createdAt: new Date().toISOString() },
    ]);
    setNewHabitName("");
    setNewHabitEmoji("🎯");
  };

  const updateHabit = (id: string, patch: Partial<Habit>) =>
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  const removeHabit = (id: string) =>
    setHabits((prev) => prev.filter((h) => h.id !== id));
  const moveHabit = (id: string, dir: -1 | 1) =>
    setHabits((prev) => {
      const idx = prev.findIndex((h) => h.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const updateMotivation = (i: number, val: string) =>
    setSettings((s) => ({ ...s, motivations: s.motivations.map((m, idx) => (idx === i ? val : m)) }));
  const addMotivation = () =>
    setSettings((s) => ({ ...s, motivations: [...s.motivations, ""] }));
  const removeMotivation = (i: number) =>
    setSettings((s) => ({ ...s, motivations: s.motivations.filter((_, idx) => idx !== i) }));

  const handleExport = () => {
    const data = JSON.stringify(exportData(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `origin-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try { importData(JSON.parse(String(reader.result))); } catch { /**/ }
    };
    reader.readAsText(file);
  };

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX = 200;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > MAX) { h *= MAX / w; w = MAX; }
        } else {
          if (h > MAX) { w *= MAX / h; h = MAX; }
        }
        canvas.width = w; canvas.height = h;
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        
        updateUser({ picture: dataUrl });

        try {
          await fetch("/api/auth/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ picture: dataUrl })
          });
        } catch {}
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const activeHabits = habits.filter((h) => !h.archived);

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <SectionLabel>Settings</SectionLabel>
        <h1 className="mt-2 font-serif text-[clamp(2rem,4.5vw,3rem)] font-medium text-silver-50">
          Your space, your way
        </h1>
      </header>

      <div className="mt-8 space-y-5">

        {/* ── Account & Cloud Sync ── */}
        <GlassCard className="p-6">
          <SectionLabel>Account &amp; Cloud Sync</SectionLabel>

          {authNotice === "success" && user && (
            <p className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-400/5 px-3.5 py-2.5 text-xs text-emerald-200/80">
              Signed in — your data is now syncing across devices.
            </p>
          )}

          {authLoading ? (
            <div className="mt-4 h-16 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.02]" />
          ) : user ? (
            <div className="mt-4">
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                <button 
                  onClick={() => picInputRef.current?.click()}
                  title="Upload profile picture"
                  className="group relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/5 transition hover:border-white/20"
                >
                  {user.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.picture} alt="" className="h-full w-full object-cover transition duration-300 group-hover:opacity-50" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="font-serif text-lg text-silver-200 transition duration-300 group-hover:opacity-0">
                      {(user.name || user.username || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                    </svg>
                  </div>
                </button>
                <input
                  ref={picInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleProfilePicUpload}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-silver-100">{user.name || user.username || "Signed in"}</p>
                  <p className="truncate text-xs text-silver-500">{user.username ? `ID: ${user.username}` : user.email}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.16em] text-silver-500">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    sync === "syncing" ? "animate-pulse bg-amber-400" :
                    sync === "error" ? "bg-red-400" : "bg-emerald-400"
                  }`} />
                  {sync === "syncing" ? "Saving…" : sync === "error" ? "Sync error" : "Synced"}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-silver-600">
                    {sync === "error"
                      ? "Couldn't reach the cloud — changes are still saved on this device."
                      : `Everything saves automatically to your account${lastSyncedAt ? ` · ${timeAgo(lastSyncedAt)}` : ""}.`}
                  </p>
                  <p className="mt-1 text-[0.66rem] text-silver-700">
                    Auto-sync runs after every change and also checks in once daily.
                  </p>
                  {manualSyncError && (
                    <p className="mt-1 text-xs text-red-300/80">{manualSyncError}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={async () => {
                      setManualSyncError(null);
                      const result = await syncNow();
                      if (!result.ok) setManualSyncError(result.error ?? "Sync failed.");
                    }}
                    disabled={sync === "syncing"}
                    className="press rounded-lg border border-white/10 px-3.5 py-1.5 text-xs font-medium text-silver-200 transition hover:border-white/25 hover:text-silver-50 disabled:cursor-wait disabled:opacity-60"
                  >
                    {sync === "syncing" ? "Syncing…" : "Sync now"}
                  </button>
                  <button
                    onClick={signOut}
                    className="press rounded-lg border border-white/10 px-3.5 py-1.5 text-xs text-silver-300 transition hover:border-white/20 hover:text-silver-100"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <AuthForm />
          )}
        </GlassCard>

        {/* ── Profile ── */}
        <GlassCard className="p-6">
          <SectionLabel>Profile</SectionLabel>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Your name">
              <TextInput
                value={settings.name}
                onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
                placeholder="e.g. Ashi"
                autoComplete="off"
              />
            </Field>
            <Field label="Currency symbol" hint="optional">
              <TextInput
                value={settings.currencySymbol}
                onChange={(e) => setSettings((s) => ({ ...s, currencySymbol: e.target.value }))}
                placeholder="₹  $  €"
                maxLength={3}
              />
            </Field>
          </div>
        </GlassCard>

        {/* ── Daily Habits ── */}
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <SectionLabel>Daily Habits</SectionLabel>
              <p className="mt-1.5 max-w-sm text-sm text-silver-500">
                These appear on the <strong className="font-medium text-silver-300">left page of your diary</strong> every day.
                Check them off as you complete them.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[0.66rem] uppercase tracking-[0.18em] text-silver-500">
              {activeHabits.length} habit{activeHabits.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Add new habit inline */}
          <div className="mt-5 flex gap-2">
            <select
              value={newHabitEmoji}
              onChange={(e) => setNewHabitEmoji(e.target.value)}
              className="shrink-0 cursor-pointer rounded-xl border border-white/10 bg-black/40 px-2 py-2.5 text-lg outline-none focus:border-amethyst-400/40"
              title="Pick emoji"
            >
              {EMOJI_OPTIONS.map((em) => (
                <option key={em} value={em} className="bg-zinc-900">{em}</option>
              ))}
            </select>
            <input
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHabit(); } }}
              placeholder="e.g. Wake before sunrise, Read 20 mins, Train…"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-silver-100 placeholder:text-silver-600 outline-none transition-colors focus:border-amethyst-400/40"
            />
            <button
              onClick={addHabit}
              className="press shrink-0 rounded-xl border border-amethyst-400/35 bg-amethyst-500/15 px-4 py-2.5 text-sm font-medium text-amethyst-200 transition hover:-translate-y-0.5 hover:bg-amethyst-500/25"
            >
              Add
            </button>
          </div>

          {/* Habit list */}
          <div className="mt-4 space-y-2">
            {activeHabits.length === 0 ? (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-white/[0.1] bg-white/[0.018] px-6 py-10 text-center">
                <div className="text-3xl">🎯</div>
                <p className="mt-3 font-serif text-lg text-silver-300">No habits yet</p>
                <p className="mt-1.5 max-w-xs text-sm text-silver-500">
                  Type a habit name above and press <strong className="text-silver-400">Add</strong>.
                  Start with 3–5 things you want to do every single day.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {[
                    { e: "🌅", n: "Wake before sunrise" },
                    { e: "🥷", n: "Train the body" },
                    { e: "📖", n: "Read 20 minutes" },
                    { e: "🎯", n: "Deep work" },
                    { e: "🧘", n: "Meditate" },
                  ].map((s) => (
                    <button
                      key={s.n}
                      onClick={() => {
                        setHabits((prev) => [
                          ...prev,
                          { id: uid(), name: s.n, emoji: s.e, createdAt: new Date().toISOString() },
                        ]);
                      }}
                      className="press rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-silver-400 transition hover:border-amethyst-400/30 hover:text-amethyst-200"
                    >
                      {s.e} {s.n}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[0.64rem] text-silver-600">or type your own above ↑</p>
              </div>
            ) : (
              habits.map((h, i) => (
                !h.archived && (
                  <HabitRow
                    key={h.id}
                    h={h}
                    i={i}
                    total={activeHabits.length}
                    onUpdate={(patch) => updateHabit(h.id, patch)}
                    onRemove={() => removeHabit(h.id)}
                    onMove={(dir) => moveHabit(h.id, dir)}
                  />
                )
              ))
            )}
          </div>
        </GlassCard>

        {/* ── Preferences ── */}
        <GlassCard className="p-6">
          <SectionLabel>Preferences</SectionLabel>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3.5 transition hover:border-white/[0.12]">
            <div>
              <p className="text-sm font-medium text-silver-200">Paper-turn sound</p>
              <p className="mt-0.5 text-xs text-silver-500">A subtle page rustle while turning the diary.</p>
            </div>
            <button
              onClick={() => setSettings((s) => ({ ...s, paperSound: !s.paperSound }))}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
                settings.paperSound ? "bg-amethyst-500/70" : "bg-white/10"
              }`}
              aria-label="Toggle paper sound"
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-silver-50 shadow transition-all duration-300 ${
                  settings.paperSound ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3.5 transition hover:border-white/[0.12]">
            <div>
              <p className="text-sm font-medium text-silver-200">Hide balance</p>
              <p className="mt-0.5 text-xs text-silver-500">Mask amounts on Asset and Home until you reveal them.</p>
            </div>
            <button
              onClick={() => setSettings((s) => ({ ...s, hideBalance: !s.hideBalance }))}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
                settings.hideBalance ? "bg-amethyst-500/70" : "bg-white/10"
              }`}
              aria-label="Toggle hide balance"
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-silver-50 shadow transition-all duration-300 ${
                  settings.hideBalance ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </GlassCard>

        {/* ── Motivational Messages ── */}
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <SectionLabel>Motivational Messages</SectionLabel>
              <p className="mt-1.5 text-sm text-silver-500">
                One of these appears on the Home screen each morning. Write your own.
              </p>
            </div>
            <button
              onClick={addMotivation}
              className="press inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[0.66rem] uppercase tracking-[0.16em] text-silver-400 transition hover:border-amethyst-400/30 hover:text-amethyst-200"
            >
              <Plus /> Add
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {settings.motivations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.09] bg-white/[0.018] px-5 py-6 text-center">
                <p className="font-serif italic text-silver-400">No messages yet.</p>
                <p className="mt-1 text-sm text-silver-600">
                  Tap &ldquo;Add&rdquo; to write the words you want to wake up to.
                  Or restore the defaults below.
                </p>
              </div>
            ) : (
              settings.motivations.map((m, i) => (
                <div key={i} className="group flex items-center gap-2">
                  <input
                    value={m}
                    onChange={(e) => updateMotivation(i, e.target.value)}
                    placeholder="Write something that drives you…"
                    className="flex-1 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 font-serif text-sm italic text-silver-200 outline-none transition-colors focus:border-amethyst-400/40"
                  />
                  <button
                    onClick={() => removeMotivation(i)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-silver-700 opacity-0 transition hover:text-red-300/80 group-hover:opacity-100"
                    aria-label="Remove"
                  ><X /></button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setSettings((s) => ({ ...s, motivations: [...DEFAULT_MOTIVATIONS] }))}
            className="mt-3 text-[0.66rem] uppercase tracking-[0.18em] text-silver-600 transition hover:text-amethyst-300"
          >
            Restore defaults
          </button>
        </GlassCard>

        {/* ── Data ── */}
        <GlassCard className="p-6">
          <SectionLabel>Data &amp; Privacy</SectionLabel>
          <p className="mt-3 text-sm text-silver-500">
            Everything is stored in this browser only — nothing leaves your device.
            Export a backup to move it or keep it safe.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export backup
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 21V9m0 0 4 4m-4-4-4 4M5 3h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Import backup
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = "";
              }}
            />
            <Button variant="ghost" onClick={() => setConfirmReset(true)} className="text-red-300/80 hover:text-red-300">
              Reset everything
            </Button>
          </div>
        </GlassCard>

        <p className="pb-4 text-center text-[0.62rem] uppercase tracking-[0.26em] text-silver-700">
          ORIGIN · private · local · yours
        </p>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset everything?">
        <p className="text-sm text-silver-400">
          This clears all habits, diary entries, bucket list, projects, balance and settings, returning
          ORIGIN to a completely blank state. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmReset(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { resetAll(); setConfirmReset(false); }}>
            Yes, reset
          </Button>
        </div>
      </Modal>
    </div>
  );
}
