import { load } from "cheerio";
import { ParkingLot } from "./queries.types";

const getFreeSpotsCount = async () => {
  const htmlResponse = await fetch(
    "https://www.parking-servis.co.rs/garaze-i-parkiralista"
  );

  const htmlStringToScrape = await htmlResponse.text();

  const $ = load(htmlStringToScrape);

  const selector = ".parking-count li";

  const spaceCounts = $(selector);

  const parkingSpaces: ParkingLot[] = [];

  spaceCounts.each((i, div) => {
    console.log($(div).find("span").text());
    const lotName = $(div).find("a").text();
    const spacesCount = $(div).find("span").text();

    parkingSpaces.push({
      lotName,
      spacesCount,
    });
  });

  console.log("ps", parkingSpaces.slice());
};

export { getFreeSpotsCount };
