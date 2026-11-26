"use client";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { copy, type Lang } from "@/lib/i18n";
import { useNow, useStoredString } from "@/lib/use-stored";
import styles from "./install-banner.module.css";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    /** Set by the inline script in layout.tsx, which can run before React hydrates. */
    __installPrompt?: InstallPromptEvent | null;
  }
}

type Mode = "hidden" | "prompt" | "ios";

const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const getMode = (): Mode => {
  if (isStandalone()) return "hidden";
  if (window.__installPrompt) return "prompt";
  if (isIos()) return "ios";
  return "hidden";
};

const subscribe = (onChange: () => void) => {
  const onPrompt = (event: Event) => {
    event.preventDefault();
    window.__installPrompt = event as InstallPromptEvent;
    onChange();
  };
  const onInstalled = () => {
    window.__installPrompt = null;
    onChange();
  };
  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);
  return () => {
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
  };
};

export default function InstallBanner({ lang }: { lang: Lang }) {
  const t = copy[lang].install;
  const mode = useSyncExternalStore(subscribe, getMode, () => "hidden" as Mode);
  const [dismissedAt, setDismissedAt] = useStoredString<string>("installDismissedAt", "");
  const now = useNow();

  if (mode === "hidden" || now === null) return null;
  if (dismissedAt && now - Number(dismissedAt) < DISMISS_FOR_MS) return null;

  const install = async () => {
    const event = window.__installPrompt;
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    window.__installPrompt = null;
    if (outcome === "dismissed") setDismissedAt(String(Date.now()));
    else window.dispatchEvent(new Event("appinstalled"));
  };

  return (
    <aside className={styles.banner} aria-label={t.title}>
      <Image src="/icons/android-chrome-192x192.png" alt="" width={44} height={44} className={styles.icon} />
      <div className={styles.text}>
        <p className={styles.title}>{t.title}</p>
        <p className={styles.body}>
          {mode === "ios" ? (
            <>
              {t.iosBefore}
              <ShareIcon />
              {t.iosAfter}
            </>
          ) : (
            t.body
          )}
        </p>
      </div>
      {mode === "prompt" && (
        <button type="button" className={styles.install} onClick={install}>
          {t.action}
        </button>
      )}
      <button
        type="button"
        className={styles.close}
        aria-label={t.dismiss}
        onClick={() => setDismissedAt(String(Date.now()))}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </aside>
  );
}

const ShareIcon = () => (
  <svg
    className={styles.shareIcon}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 15V3M8 7l4-4 4 4" />
    <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
  </svg>
);
