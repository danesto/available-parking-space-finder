"use client";
import { useEffect } from "react";

/** Registers /sw.js in production so the app stays installable and opens offline. */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Not critical: the app works fine without a service worker.
    });
  }, []);

  return null;
}
