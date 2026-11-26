import "server-only";
import https from "node:https";
import tls from "node:tls";
import { load } from "cheerio";
import { unstable_cache } from "next/cache";
import { SECTIGO_OV_R36 } from "./certs";
import type { Lot, LotKind, LotsPayload } from "./types";

const SOURCE_URL = "https://www.parking-servis.co.rs/garaze-i-parkiralista";

/**
 * How long (seconds) a scrape is reused before the source site is hit again.
 * The cache is shared across all visitors, so the source sees at most about
 * one request per minute however much traffic we get.
 */
export const REVALIDATE_SECONDS = 60;

const KIND_PREFIXES: [RegExp, LotKind][] = [
  [/^gara[žz]a\s+/i, "garage"],
  [/^parkirali[šs]te\s+/i, "lot"],
];

const parseName = (raw: string): { name: string; kind: LotKind } => {
  const text = raw.replace(/\s+/g, " ").trim();
  for (const [prefix, kind] of KIND_PREFIXES) {
    if (prefix.test(text)) {
      const name = text.replace(prefix, "").replace(/^["„“]\s*|\s*["“”]$/g, "");
      return { name: name.trim(), kind };
    }
  }
  return { name: text, kind: "other" };
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "dj")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const parseLots = (html: string): Lot[] => {
  const $ = load(html);
  const lots: Lot[] = [];

  $(".parking-count li").each((_, li) => {
    const anchor = $(li).find("a").first();
    const rawName = anchor.text();
    if (!rawName.trim()) return;

    const { name, kind } = parseName(rawName);
    const count = Number.parseInt($(li).find(".count, span").first().text(), 10);
    const href = anchor.attr("href");

    lots.push({
      id: `${kind}-${slugify(name)}`,
      name,
      kind,
      free: Number.isFinite(count) ? count : null,
      mapUrl: href?.startsWith("http") ? href : undefined,
    });
  });

  return lots;
};

type SourcePage = { html: string; date: string | null };

/** Fetches the source page over HTTPS, trusting the intermediate the site forgets to send. */
const fetchSourcePage = () =>
  new Promise<SourcePage>((resolve, reject) => {
    const request = https.get(
      SOURCE_URL,
      {
        ca: [...tls.rootCertificates, SECTIGO_OV_R36],
        headers: {
          "user-agent": "belgrade-parking-finder/2.0 (+https://github.com/danesto/available-parking-space-finder)",
          accept: "text/html",
        },
        timeout: 8000,
      },
      (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`Source responded with ${response.statusCode}`));
          return;
        }
        response.setEncoding("utf8");
        let html = "";
        response.on("data", (chunk: string) => (html += chunk));
        response.on("end", () => resolve({ html, date: response.headers.date ?? null }));
        response.on("error", reject);
      },
    );
    request.on("timeout", () => request.destroy(new Error("Source timed out")));
    request.on("error", reject);
  });

/**
 * Scrapes and parses the source. Shared across all visitors and instances via
 * Next's data cache for REVALIDATE_SECONDS. A thrown error is never cached, and
 * while a refresh fails the last good result keeps being served.
 */
const loadLotsCached = unstable_cache(
  async (): Promise<LotsPayload> => {
    const { html, date } = await fetchSourcePage();
    const lots = parseLots(html);
    if (lots.length === 0) {
      throw new Error("No parking lots found in the source page");
    }
    const parsedDate = date ? new Date(date) : new Date();
    const updatedAt = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    return { lots, updatedAt: updatedAt.toISOString() };
  },
  ["parking-lots-v2"],
  { revalidate: REVALIDATE_SECONDS },
);

export const getLots = async (): Promise<LotsPayload> => {
  try {
    return await loadLotsCached();
  } catch (error) {
    console.error("[parking] failed to load lots:", error);
    return {
      lots: [],
      updatedAt: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
