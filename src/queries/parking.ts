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
    const spacesCount = $(div).find("span").text();

    parkingSpaces.push({
      lotName,
      spacesCount,
    });
  });

  return parkingSpaces;
};

const getFreeSpotsCount = async () => {
  unstable_noStore();

  if (kv) {
    const cachedParkingData: ParkingLot[] | null = await kv.get("parking_lots");

    if (cachedParkingData) {
      if (cachedParkingData?.length > 0) {
        console.log("returning cached data: ", cachedParkingData);
        return cachedParkingData;
      }
    } else {
      const freshData = await scrapeParkingLotsData();
      console.log("IM HERE GETTING FRESH DATA");

      await kv.set("parking_lots", JSON.stringify(freshData), {
        ex: 60 * 4,
      });

      return freshData;
    }
  }
};

export { getFreeSpotsCount };
