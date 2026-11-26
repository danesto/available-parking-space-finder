"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lot, LotsPayload } from "@/lib/types";
import { copy, LOCALES, type Lang } from "@/lib/i18n";
import { getAvailability, normalizeForSearch } from "@/lib/text";
import { useNow, useStoredString } from "@/lib/use-stored";
import InstallBanner from "./install-banner";
import styles from "./parking-board.module.css";

/** How often the open tab asks our API for new numbers. */
const POLL_MS = 60_000;
/** When the tab becomes visible again, refresh only if data is older than this. */
const REFOCUS_MS = 30_000;
/** Minimum gap between manual refreshes. */
const MANUAL_COOLDOWN_MS = 10_000;
const STALE_MS = 5 * 60_000;

type KindFilter = "all" | "garage" | "lot";
type SortOrder = "name" | "free";

export default function ParkingBoard({ initial }: { initial: LotsPayload }) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState("");
  const [lang, setLang] = useStoredString<Lang>("lang", "sr");
  const [kind, setKind] = useStoredString<KindFilter>("kind", "all");
  const [sort, setSort] = useStoredString<SortOrder>("sort", "name");
  const [favoritesRaw, setFavoritesRaw] = useStoredString<string>("favorites", "");
  const now = useNow();

  const t = copy[lang];
  const dataRef = useRef(initial);
  const lastFetch = useRef(0);
  const inFlight = useRef(false);
  const [lastFetchAt, setLastFetchAt] = useState(0);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    lastFetch.current = Date.now();
    setLastFetchAt(lastFetch.current);
    setLoading(true);

    const previous = dataRef.current;
    let next: LotsPayload;
    try {
      const response = await fetch("/api/lots", { cache: "no-store" });
      next = await response.json();
    } catch {
      next = { lots: [], updatedAt: null, error: "network" };
    }

    if (next.error && previous.lots.length) {
      // Keep showing the last good numbers if the source is temporarily down.
      next = { ...previous, error: next.error };
    } else {
      const before = new Map(previous.lots.map((lot) => [lot.id, lot.free]));
      setChanged(
        new Set(
          next.lots
            .filter((lot) => before.has(lot.id) && before.get(lot.id) !== lot.free)
            .map((lot) => lot.id),
        ),
      );
    }

    dataRef.current = next;
    setData(next);
    inFlight.current = false;
    setLoading(false);
  }, []);

  // Poll while the tab is visible; catch up when the user comes back to it.
  useEffect(() => {
    lastFetch.current = Date.now();
    const tick = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastFetch.current > REFOCUS_MS
      ) {
        refresh();
      }
    };
    const id = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    if (!changed.size) return;
    const id = window.setTimeout(() => setChanged(new Set()), 2500);
    return () => window.clearTimeout(id);
  }, [changed]);

  useEffect(() => {
    document.documentElement.lang = LOCALES[lang];
  }, [lang]);

  const favorites = useMemo(
    () => new Set(favoritesRaw.split(",").filter(Boolean)),
    [favoritesRaw],
  );

  const toggleFavorite = (id: string) => {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavoritesRaw([...next].join(","));
  };

  const visible = useMemo(() => {
    const q = normalizeForSearch(query);
    const collator = new Intl.Collator("sr-Latn");
    return data.lots
      .filter((lot) => kind === "all" || lot.kind === kind)
      .filter((lot) => !q || normalizeForSearch(lot.name).includes(q))
      .sort((a, b) =>
        sort === "free"
          ? (b.free ?? -1) - (a.free ?? -1) || collator.compare(a.name, b.name)
          : collator.compare(a.name, b.name),
      );
  }, [data.lots, query, kind, sort]);

  const pinned = visible.filter((lot) => favorites.has(lot.id));
  const rest = visible.filter((lot) => !favorites.has(lot.id));

  const updatedAtMs = data.updatedAt ? Date.parse(data.updatedAt) : null;
  const isStale = now !== null && updatedAtMs !== null && now - updatedAtMs > STALE_MS;
  const canRefresh = !loading && (now === null || now - lastFetchAt >= MANUAL_COOLDOWN_MS);

  const renderLot = (lot: Lot) => (
    <LotRow
      key={lot.id}
      lot={lot}
      lang={lang}
      favorite={favorites.has(lot.id)}
      changed={changed.has(lot.id)}
      onToggleFavorite={() => toggleFavorite(lot.id)}
    />
  );

  return (
    <div className={styles.board}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.pSign} aria-hidden="true">
            P
          </span>
          <div>
            <h1 className={styles.title}>{t.title}</h1>
            <p className={styles.subtitle}>{t.subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          className={styles.langButton}
          onClick={() => setLang(lang === "sr" ? "en" : "sr")}
          aria-label={t.switchLangLabel}
          lang={lang === "sr" ? "en" : "sr-Cyrl"}
        >
          {t.switchLang}
        </button>
      </header>

      <div className={styles.statusBar} aria-live="polite">
        <span className={`${styles.liveDot} ${isStale || data.error ? styles.liveDotStale : ""}`} />
        <span className={styles.statusText}>
          {loading ? (
            t.updating
          ) : updatedAtMs ? (
            <>
              {t.updated}{" "}
              <time dateTime={data.updatedAt ?? undefined} title={formatClock(updatedAtMs, lang)}>
                {now === null ? formatClock(updatedAtMs, lang) : formatRelative(updatedAtMs, now, lang)}
              </time>
            </>
          ) : (
            t.noData
          )}
        </span>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={refresh}
          disabled={!canRefresh}
        >
          <RefreshIcon spinning={loading} />
          {t.refresh}
        </button>
      </div>

      {(data.error || isStale) && (
        <p className={styles.notice} role="status">
          {data.error ? t.error : t.stale}
        </p>
      )}

      <InstallBanner lang={lang} />

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <SearchIcon />
          <input
            type="search"
            className={styles.search}
            placeholder={t.search}
            aria-label={t.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
          />
        </div>
        <div className={styles.toggles}>
          <Segmented
            label={t.filterLabel}
            value={kind}
            onChange={setKind}
            options={[
              ["all", t.filters.all],
              ["garage", t.filters.garage],
              ["lot", t.filters.lot],
            ]}
          />
          <Segmented
            label={t.sortLabel}
            value={sort}
            onChange={setSort}
            options={[
              ["name", t.sort.name],
              ["free", t.sort.free],
            ]}
          />
        </div>
      </div>

      {visible.length === 0 && query ? (
        <div className={styles.empty}>
          <p>{t.noResults(query)}</p>
          <button type="button" className={styles.textButton} onClick={() => setQuery("")}>
            {t.clearSearch}
          </button>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <section aria-labelledby="favorites-heading">
              <h2 id="favorites-heading" className={styles.groupTitle}>
                {t.favorites}
              </h2>
              <ul className={styles.list}>{pinned.map(renderLot)}</ul>
            </section>
          )}
          {rest.length > 0 && (
            <section aria-labelledby={pinned.length ? "others-heading" : undefined}>
              {pinned.length > 0 && (
                <h2 id="others-heading" className={styles.groupTitle}>
                  {t.others}
                </h2>
              )}
              <ul className={styles.list}>{rest.map(renderLot)}</ul>
            </section>
          )}
        </>
      )}

      <footer className={styles.footer}>
        <p>{t.autoRefresh}</p>
        <p>
          <a href="https://www.parking-servis.co.rs/garaze-i-parkiralista" target="_blank" rel="noreferrer">
            {t.source}
          </a>
          {" · "}
          <a href="https://github.com/danesto/available-parking-space-finder" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

function LotRow({
  lot,
  lang,
  favorite,
  changed,
  onToggleFavorite,
}: {
  lot: Lot;
  lang: Lang;
  favorite: boolean;
  changed: boolean;
  onToggleFavorite: () => void;
}) {
  const t = copy[lang];
  const availability = getAvailability(lot.free);
  const countLabel =
    lot.free === null ? t.noData : lot.free <= 0 ? t.full : t.freeSpaces(lot.free);

  return (
    <li className={styles.row}>
      <button
        type="button"
        className={styles.star}
        aria-pressed={favorite}
        aria-label={`${favorite ? t.removeFavorite : t.addFavorite}: ${lot.name}`}
        onClick={onToggleFavorite}
      >
        <StarIcon filled={favorite} />
      </button>
      <div className={styles.lotText}>
        {lot.mapUrl ? (
          <a
            href={lot.mapUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.lotName}
            title={t.openMap}
          >
            {lot.name}
            <PinIcon />
          </a>
        ) : (
          <span className={styles.lotName}>{lot.name}</span>
        )}
        <span className={styles.lotKind}>{t.kind[lot.kind]}</span>
      </div>
      <div
        className={`${styles.sign} ${changed ? styles.signChanged : ""}`}
        data-availability={availability}
        aria-label={countLabel}
        role="img"
      >
        {lot.free === null ? "—" : lot.free <= 0 ? t.full : lot.free}
      </div>
    </li>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: [T, string][];
}) {
  return (
    <div className={styles.segmented} role="group" aria-label={label}>
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

const formatClock = (ms: number, lang: Lang) =>
  new Intl.DateTimeFormat(LOCALES[lang], { hour: "2-digit", minute: "2-digit" }).format(ms);

const formatRelative = (ms: number, now: number, lang: Lang) => {
  const seconds = Math.round((ms - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(LOCALES[lang], { numeric: "auto", style: "long" });
  if (Math.abs(seconds) < 60) return rtf.format(Math.min(seconds, 0), "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  return formatClock(ms, lang);
};

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
  <svg {...iconProps} className={spinning ? styles.spin : undefined}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
);

const SearchIcon = () => (
  <svg {...iconProps} className={styles.searchIcon}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg {...iconProps} width={20} height={20} fill={filled ? "currentColor" : "none"}>
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8Z" />
  </svg>
);

const PinIcon = () => (
  <svg {...iconProps} width={15} height={15} className={styles.pinIcon}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);
