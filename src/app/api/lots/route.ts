import { getLots, REVALIDATE_SECONDS } from "@/lib/parking";

export const revalidate = 60;

export async function GET() {
  const data = await getLots();

  return Response.json(data, {
    headers: {
      // Let the CDN absorb client polling; the source is only re-fetched
      // once the data cache expires.
      "cache-control": data.error
        ? "no-store"
        : `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${REVALIDATE_SECONDS}`,
    },
  });
}
