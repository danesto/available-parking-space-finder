import ParkingBoard from "@/components/parking-board";
import { getLots } from "@/lib/parking";

// Re-render at most once a minute; matches the scrape cache in lib/parking.ts.
export const revalidate = 60;

export default async function Home() {
  const data = await getLots();

  return (
    <main>
      <ParkingBoard initial={data} />
    </main>
  );
}
