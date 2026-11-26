export type LotKind = "garage" | "lot" | "other";

export type Lot = {
  id: string;
  name: string;
  kind: LotKind;
  /** Number of free spaces, or null when the source did not report a number. */
  free: number | null;
  mapUrl?: string;
};

export type LotsPayload = {
  lots: Lot[];
  /** ISO timestamp of when the data was read from the source site. */
  updatedAt: string | null;
  error?: string;
};
