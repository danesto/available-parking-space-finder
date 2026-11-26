const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ђ: "dj", е: "e", ж: "z", з: "z",
  и: "i", ј: "j", к: "k", л: "l", љ: "lj", м: "m", н: "n", њ: "nj", о: "o",
  п: "p", р: "r", с: "s", т: "t", ћ: "c", у: "u", ф: "f", х: "h", ц: "c",
  ч: "c", џ: "dz", ш: "s",
};

/**
 * Normalizes text for forgiving search: lowercase, Cyrillic → Latin,
 * diacritics stripped (š → s, đ → dj), so "шумат", "sumat" and "Šumat" match.
 */
export const normalizeForSearch = (value: string) =>
  value
    .toLowerCase()
    .replace(/[а-џ]/g, (ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

export type Availability = "plenty" | "some" | "few" | "full" | "unknown";

export const getAvailability = (free: number | null): Availability => {
  if (free === null) return "unknown";
  if (free <= 0) return "full";
  if (free < 10) return "few";
  if (free <= 20) return "some";
  return "plenty";
};
