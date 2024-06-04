import { load } from "cheerio";
import { ParkingLot } from "./queries.types";
import { kv } from "@vercel/kv";
import { unstable_noStore } from "next/cache";

const scrapeParkingLotsData = async () => {
  const htmlResponse = await fetch(
    "https://www.parking-servis.co.rs/garaze-i-parkiralista"
  );

  const htmlStringToScrape = await htmlResponse.text();

  const $ = load(htmlStringToScrape);

  const selector = ".parking-count li";

  const spaceCounts = $(selector);

  const parkingSpaces: ParkingLot[] = [];

  spaceCounts.each((i, div) => {
    const lotName = $(div).find("a").text();
    const lotLocation = $(div).find("a").attr("href");
    const spacesCount = $(div).find("span").text();

    parkingSpaces.push({
      lotName,
      lotLocation,
      spacesCount,
    });
  });

  return parkingSpaces;
};

const getFreeSpotsCount = async () => {
  unstable_noStore();

  if (kv) {
    const cachedParkingData: ParkingLot[] | null = await kv.get("parking_lots");

    if (cachedParkingData && cachedParkingData?.length > 0) {
      return cachedParkingData;
    } else {
      const freshData = await scrapeParkingLotsData();

      await kv.set("parking_lots", JSON.stringify(freshData), {
        ex: 60 * 4,
      });

      return freshData;
    }
  }
};

export { getFreeSpotsCount };
