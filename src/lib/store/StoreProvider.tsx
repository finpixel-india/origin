"use client";

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocalStorage } from "./useLocalStorage";
import { addDaysKey } from "@/lib/date";
import type {
  Account,
  Balance,
  BucketItem,
  DiaryEntry,
  Entries,
  FocusItem,
  Habit,
  OriginData,
  Project,
  Settings,
} from "./types";

const STORAGE_VERSION = "v2";

const defaultSettings: Settings = {
  name: "",
  motivations: [],
  paperSound: true,
  currencySymbol: "₹",
  hideBalance: false,
};

const defaultHabits: Habit[] = [];
const defaultBucket: BucketItem[] = [];
const defaultProjects: Project[] = [];
const defaultBalance: Balance = { accounts: [] };
const defaultFocus: FocusItem[] = [];

function emptyEntry(date: string): DiaryEntry {
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

type StoreValue = {
  ready: boolean;

  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;

  habits: Habit[];
  setHabits: Dispatch<SetStateAction<Habit[]>>;

  entries: Entries;
  updateEntry: (date: string, patch: Partial<DiaryEntry>) => void;
  toggleHabit: (date: string, habitId: string) => void;
  getEntry: (date: string) => DiaryEntry;

  bucket: BucketItem[];
  setBucket: Dispatch<SetStateAction<BucketItem[]>>;

  projects: Project[];
  setProjects: Dispatch<SetStateAction<Project[]>>;

  balance: Balance;
  setBalance: Dispatch<SetStateAction<Balance>>;

  focus: FocusItem[];
  setFocus: Dispatch<SetStateAction<FocusItem[]>>;

  exportData: () => OriginData;
  importData: (data: Partial<OriginData>) => void;
  resetAll: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const key = (slice: string) => `origin.${slice}.${STORAGE_VERSION}`;
  const [settings, setSettings] = useLocalStorage<Settings>(key("settings"), defaultSettings);
  const [habits, setHabits] = useLocalStorage<Habit[]>(key("habits"), defaultHabits);
  const [entries, setEntries] = useLocalStorage<Entries>(key("entries"), {});
  const [bucket, setBucket] = useLocalStorage<BucketItem[]>(key("bucket"), defaultBucket);
  const [projects, setProjects] = useLocalStorage<Project[]>(key("projects"), defaultProjects);
  const [balance, setBalance] = useLocalStorage<Balance>(key("balance"), defaultBalance);
  const [focus, setFocus] = useLocalStorage<FocusItem[]>(key("focus"), defaultFocus);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  // Migrate: existing users who never set a currency get ₹ (Indian Rupees).
  useEffect(() => {
    if (!ready) return;
    if (settings.currencySymbol === "") {
      setSettings((s) => ({ ...s, currencySymbol: "₹" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const getEntry = useCallback(
    (date: string): DiaryEntry => entries[date] ?? emptyEntry(date),
    [entries]
  );

  const updateEntry = useCallback(
    (date: string, patch: Partial<DiaryEntry>) => {
      setEntries((prev) => {
        const existing = prev[date] ?? emptyEntry(date);
        return {
          ...prev,
          [date]: { ...existing, ...patch, date, updatedAt: new Date().toISOString() },
        };
      });
    },
    [setEntries]
  );

  const toggleHabit = useCallback(
    (date: string, habitId: string) => {
      setEntries((prev) => {
        const existing = prev[date] ?? emptyEntry(date);
        const completions = { ...existing.completions };
        if (completions[habitId]) {
          delete completions[habitId];
        } else {
          completions[habitId] = true;
        }
        return {
          ...prev,
          [date]: { ...existing, completions, date, updatedAt: new Date().toISOString() },
        };
      });
    },
    [setEntries]
  );

  const exportData = useCallback(
    (): OriginData => ({ settings, habits, entries, bucket, projects, balance, focus }),
    [settings, habits, entries, bucket, projects, balance, focus]
  );

  const importData = useCallback(
    (data: Partial<OriginData>) => {
      if (data.settings) setSettings(data.settings);
      if (data.habits) setHabits(data.habits);
      if (data.entries) setEntries(data.entries);
      if (data.bucket) setBucket(data.bucket);
      if (data.projects) setProjects(data.projects);
      if (data.balance) setBalance(data.balance);
      if (data.focus) setFocus(data.focus);
    },
    [setSettings, setHabits, setEntries, setBucket, setProjects, setBalance, setFocus]
  );

  const resetAll = useCallback(() => {
    setSettings(defaultSettings);
    setHabits([]);
    setEntries({});
    setBucket([]);
    setProjects([]);
    setBalance({ accounts: [] });
    setFocus([]);
  }, [setSettings, setHabits, setEntries, setBucket, setProjects, setBalance, setFocus]);

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      settings,
      setSettings,
      habits,
      setHabits,
      entries,
      getEntry,
      updateEntry,
      toggleHabit,
      bucket,
      setBucket,
      projects,
      setProjects,
      balance,
      setBalance,
      focus,
      setFocus,
      exportData,
      importData,
      resetAll,
    }),
    [
      ready,
      settings,
      setSettings,
      habits,
      setHabits,
      entries,
      getEntry,
      updateEntry,
      toggleHabit,
      bucket,
      setBucket,
      projects,
      setProjects,
      balance,
      setBalance,
      focus,
      setFocus,
      exportData,
      importData,
      resetAll,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return ctx;
}

/** Compute habit stats for a given date's entry. */
export function habitStats(habits: Habit[], entry: DiaryEntry) {
  const active = habits.filter((h) => !h.archived);
  const total = active.length;
  const done = active.filter((h) => entry.completions[h.id]).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, pct };
}

/** Compute a current streak ending at `dateKey` (consecutive days meeting threshold). */
export function computeStreak(
  entries: Entries,
  habits: Habit[],
  dateKey: string,
  allRequired = false
): number {
  const active = habits.filter((h) => !h.archived);
  const total = active.length;
  if (total === 0) return 0;
  let cursor = dateKey;
  const today = entries[cursor];
  const todayDone =
    today && active.filter((h) => today.completions[h.id]).length >= (allRequired ? total : 1);
  if (!todayDone) cursor = addDaysKey(cursor, -1);

  let streak = 0;
  for (let i = 0; i < 3650; i++) {
    const e = entries[cursor];
    const meets =
      e && active.filter((h) => e.completions[h.id]).length >= (allRequired ? total : 1);
    if (meets) {
      streak += 1;
      cursor = addDaysKey(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

/** The manually-set starting balance (falls back to legacy account sums). */
export function balanceBase(balance: Balance): number {
  if (typeof balance.baseAmount === "number") return balance.baseAmount;
  return (balance.accounts ?? []).reduce((sum, a: Account) => sum + (Number(a.amount) || 0), 0);
}

/** Net effect of all earnings (+) and spendings (−). */
export function transactionsNet(balance: Balance): number {
  return (balance.transactions ?? []).reduce(
    (sum, t) => sum + (t.kind === "earning" ? 1 : -1) * (Number(t.amount) || 0),
    0
  );
}

export function balanceTotal(balance: Balance): number {
  return balanceBase(balance) + transactionsNet(balance);
}

/** Current streak for ONE specific habit, ending at `dateKey`. */
export function habitStreak(entries: Entries, habitId: string, dateKey: string): number {
  let cursor = dateKey;
  const today = entries[cursor];
  if (!today?.completions[habitId]) cursor = addDaysKey(cursor, -1);

  let streak = 0;
  for (let i = 0; i < 3650; i++) {
    const e = entries[cursor];
    if (e?.completions[habitId]) {
      streak += 1;
      cursor = addDaysKey(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

/** Total completions of ONE habit across all recorded days. */
export function habitTotalCompletions(entries: Entries, habitId: string): number {
  let n = 0;
  for (const key of Object.keys(entries)) {
    if (entries[key]?.completions[habitId]) n += 1;
  }
  return n;
}

/** Daily completion counts for the last `days` days (oldest → newest). */
export function dailySeries(
  entries: Entries,
  habits: Habit[],
  days: number,
  dateKey: string
): { date: string; done: number; total: number }[] {
  const active = habits.filter((h) => !h.archived);
  const total = active.length;
  const out: { date: string; done: number; total: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDaysKey(dateKey, -i);
    const e = entries[d];
    const done = active.filter((h) => e?.completions[h.id]).length;
    out.push({ date: d, done, total });
  }
  return out;
}
