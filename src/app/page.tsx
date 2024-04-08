import { getFreeSpotsCount } from "@/queries/parking";
import styles from "./page.module.css";

export default async function Home() {
  const data = await getFreeSpotsCount();

  return <main className={styles.main}>testing</main>;
}
