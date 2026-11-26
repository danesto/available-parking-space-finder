"use client";
import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * A string value persisted in localStorage. Renders `fallback` on the server
 * and during hydration, then switches to the stored value, so there is no
 * hydration mismatch.
 */
export const useStoredString = <T extends string>(key: string, fallback: T) => {
  const value = useSyncExternalStore(
    subscribe,
    () => (read(key) as T | null) ?? fallback,
    () => fallback,
  );

  const setValue = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Storage can be unavailable (private mode); the change just won't persist.
      }
      notify();
    },
    [key],
  );

  return [value, setValue] as const;
};

const subscribeClock = (listener: () => void) => {
  const id = window.setInterval(listener, 5000);
  return () => window.clearInterval(id);
};

/** Current time rounded to 5 s, or null on the server / during hydration. */
export const useNow = () =>
  useSyncExternalStore(
    subscribeClock,
    () => Math.floor(Date.now() / 5000) * 5000,
    () => null,
  );
