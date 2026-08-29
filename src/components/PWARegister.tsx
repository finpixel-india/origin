"use client";

import { useEffect } from "react";

/**
 * Registers the service worker so browsers consider ORIGIN installable.
 * No-op in dev (Next.js handles hot-reload better without an SW in the way).
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          /* ignore — the app still works fully without it */
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
