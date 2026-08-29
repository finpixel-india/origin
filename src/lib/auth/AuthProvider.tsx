"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useStore } from "@/lib/store";
import type { OriginData } from "@/lib/store";

type AuthUser = {
  id: string;
  username?: string | null;
  email?: string | null;
  name: string | null;
  picture?: string | null;
};
type SyncState = "idle" | "syncing" | "saved" | "error";
type AuthResult = { ok: boolean; error?: string };

type AuthValue = {
  loading: boolean;
  configured: boolean;
  user: AuthUser | null;
  sync: SyncState;
  lastSyncedAt: number | null;
  login: (username: string, password: string) => Promise<AuthResult>;
  register: (username: string, password: string) => Promise<AuthResult>;
  syncNow: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

/** Deterministic JSON (sorted keys) so key-order differences never trigger spurious saves. */
function stableStringify(value: unknown): string {
  const seen = new WeakSet();
  const walk = (v: unknown): unknown => {
    if (v && typeof v === "object") {
      if (seen.has(v as object)) return null;
      seen.add(v as object);
      if (Array.isArray(v)) return v.map(walk);
      const obj = v as Record<string, unknown>;
      return Object.keys(obj)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = walk(obj[k]);
          return acc;
        }, {});
    }
    return v;
  };
  return JSON.stringify(walk(value));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { ready, exportData, importData } = useStore();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sync, setSync] = useState<SyncState>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  // The user id we've already hydrated data for. Reset to null on login/logout.
  const hydratedFor = useRef<string | null>(null);
  // Snapshot of the last data we pushed (avoids redundant uploads).
  const lastPushed = useRef<string>("");
  // Debounce timer for cloud writes.
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 1. Load session on mount ──
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const json = await res.json();
        if (alive) {
          setUser(json.user ?? null);
        }
      } catch {
        /* offline — stay local-only */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ── Helper: push current local data to the cloud (non-debounced) ──
  const pushNow = useCallback(async (): Promise<boolean> => {
    try {
      const local = exportData();
      const body = stableStringify(local);
      if (body === lastPushed.current) return true; // nothing new
      const res = await fetch("/api/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: local }),
      });
      if (!res.ok) return false;
      lastPushed.current = body;
      return true;
    } catch {
      return false;
    }
  }, [exportData]);

  // Watch the stable snapshot of all data — schedule a debounced push when it changes.
  const snapshot = ready ? stableStringify(exportData()) : "";
  const prevSnapshot = useRef(snapshot);
  useEffect(() => {
    if (snapshot !== prevSnapshot.current) {
      prevSnapshot.current = snapshot;
      if (!user || !ready || hydratedFor.current !== user.id) return;

      if (pushTimer.current) clearTimeout(pushTimer.current);
      setSync("syncing");
      pushTimer.current = setTimeout(async () => {
        const ok = await pushNow();
        if (ok) {
          setSync("saved");
          setLastSyncedAt(Date.now());
        } else {
          setSync("error");
        }
      }, 800);
    }
    // Cleanup the timer when snapshot changes again or deps update.
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [snapshot, user, ready, pushNow]);

  // ── 2. Hydrate from the cloud (once per login) ──
  useEffect(() => {
    if (!ready || !user) return;
    if (hydratedFor.current === user.id) return; // already loaded this user's data

    // Mark that we're loading THIS user so we don't double-trigger.
    hydratedFor.current = user.id;

    (async () => {
      setSync("syncing");
      try {
        const res = await fetch("/api/data", { cache: "no-store" });
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        const json = (await res.json()) as { data: OriginData | null };

        if (json.data && typeof json.data === "object") {
          // Cloud has saved data — replace this device's state.
          importData(json.data);
          lastPushed.current = stableStringify(json.data);
        } else {
          // Nothing in the cloud yet — push this device's data up.
          const local = exportData();
          lastPushed.current = stableStringify(local);
          const saved = await pushNow();
          if (!saved) throw new Error("initial push failed");
        }
        setSync("saved");
        setLastSyncedAt(Date.now());
      } catch {
        setSync("error");
      }
    })();
    // Only re-run when the user or readiness changes.
  }, [ready, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncNow = useCallback(async (): Promise<AuthResult> => {
    if (!user) return { ok: false, error: "Sign in first." };
    if (!ready) return { ok: false, error: "Data is still loading." };
    if (pushTimer.current) clearTimeout(pushTimer.current);
    setSync("syncing");
    const ok = await pushNow();
    if (ok) {
      setSync("saved");
      setLastSyncedAt(Date.now());
      return { ok: true };
    }
    setSync("error");
    return { ok: false, error: "Could not sync right now." };
  }, [pushNow, ready, user]);

  // ── 3. Flush pending writes on sign-out, tab close, visibility change, and once daily ──
  useEffect(() => {
    if (!ready || !user || hydratedFor.current !== user.id) return;
    const flush = () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      void pushNow();
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const daily = window.setInterval(flush, 24 * 60 * 60 * 1000);

    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.clearInterval(daily);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", visibility);
      flush();
    };
  }, [user, ready, pushNow]);

  // ── Auth actions ──
  const login = useCallback(async (username: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok) return { ok: false, error: json.error || "Sign-in failed." };
      // Reset hydration so the cloud data loads fresh for this user.
      hydratedFor.current = null;
      lastPushed.current = "";
      setUser(json.user);
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  }, []);

  const register = useCallback(async (username: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok) return { ok: false, error: json.error || "Could not create account." };
      hydratedFor.current = null;
      lastPushed.current = "";
      setUser(json.user);
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  }, []);

  const signOut = useCallback(async () => {
    // Flush any pending writes BEFORE destroying the session.
    if (pushTimer.current) clearTimeout(pushTimer.current);
    await pushNow();
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {
      /* ignore */
    }
    hydratedFor.current = null;
    lastPushed.current = "";
    setUser(null);
    setSync("idle");
    setLastSyncedAt(null);
  }, [pushNow]);

  const value = useMemo<AuthValue>(
    () => ({ loading, configured: true, user, sync, lastSyncedAt, login, register, syncNow, signOut }),
    [loading, user, sync, lastSyncedAt, login, register, syncNow, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
