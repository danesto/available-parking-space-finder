import { getFreeSpotsCount } from "@/queries/parking";
import styles from "./page.module.css";
import LotsList from "@/components/lots-list";
import { unstable_cache as nextjsCache } from "next/cache";
import CoverPhoto from "@/assets/beograd.avif";
import Image from "next/image";

export default async function Home() {
  const parkingLotsData = await nextjsCache(
    getFreeSpotsCount,
    ["parking_lots_cache_key"],
    { revalidate: 240 }
  )();

  return (
    <main className={styles.main}>
      <Image
        {...CoverPhoto}
        className={styles["background-image"]}
        alt="belgrade city cover photo"
      />
      <LotsList parkingLots={parkingLotsData} />
    </main>
  );
}
