import { getFreeSpotsCount } from "@/queries/parking";
import styles from "./page.module.css";
import LotsList from "@/components/lots-list";
import CoverPhoto from "@/assets/beograd.avif";
import Image from "next/image";

export default async function Home() {
  const parkingLotsData = await getFreeSpotsCount();

  return (
    <main className={styles.main}>
      <Image
        src={CoverPhoto.src}
        width={CoverPhoto.width}
        height={CoverPhoto.height}
        className={styles["background-image"]}
        alt="belgrade city cover photo"
      />
      <LotsList parkingLots={parkingLotsData} />
    </main>
  );
}
