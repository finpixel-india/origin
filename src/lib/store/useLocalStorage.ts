"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

/**
 * Persisted state hook. Reads from localStorage after mount (client-only) to
 * avoid SSR hydration mismatches. Writes are debounced + coalesced with
 * requestIdleCallback so rapid updates (e.g. typing) never block the main
 * thread. A final flush on unmount / pagehide guarantees nothing is lost.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const keyRef = useRef(key);
  keyRef.current = key;

  const latest = useRef<T>(value);
  latest.current = value;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted value once on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(keyRef.current);
      if (raw != null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist (debounced) whenever value changes after hydration.
  useEffect(() => {
    if (!hydrated) return;

    const write = () => {
      try {
        window.localStorage.setItem(keyRef.current, JSON.stringify(latest.current));
      } catch {
        /* ignore */
      }
    };

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const ric = (window as unknown as {
        requestIdleCallback?: (cb: () => void) => number;
      }).requestIdleCallback;
      if (ric) ric(write);
      else write();
    }, 260);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, hydrated]);

  // Flush pending writes before the tab is hidden / closed.
  useEffect(() => {
    if (!hydrated) return;
    const flush = () => {
      try {
        window.localStorage.setItem(keyRef.current, JSON.stringify(latest.current));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
      flush();
    };
  }, [hydrated]);

  return [value, setValue, hydrated];
}
