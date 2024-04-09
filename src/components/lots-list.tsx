"use client";
import { ParkingLot } from "@/queries/queries.types";
import { getLotClassNameByCount } from "./helpers";
import styles from "./lots-list.module.css";
import { ChangeEvent, useState } from "react";
import ExternalLink from "@/assets/icons/link-external.svg";
import Link from "next/link";
import Image from "next/image";

type LotsListProps = {
  parkingLots?: ParkingLot[];
};

const LotsList = ({ parkingLots }: LotsListProps) => {
  const [searchQ, setSearchQ] = useState<string>();

  const handleSetSearchValue = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQ(e.target.value);
  };

  if (!parkingLots?.length) {
    return "Nema podataka trenutno (There is no data at the moment)";
  }

  return (
    <div className={styles["lots-container"]}>
      <input
        className={styles["search-lots-input"]}
        placeholder="Претражи по називу (Search)..."
        aria-label="Pretrazi parkilarista po nazivu (Search parking lots by name)"
        onChange={handleSetSearchValue}
      />
      <div className={styles["lots-header"]}>
        <div className={styles["header-col"]}>
          <span>Паркиралиште</span> <span>(Parking lot)</span>
        </div>
        <div className={styles["header-col"]}>
          <span>Број слободних места</span> <span>(Spaces available)</span>
        </div>
      </div>
      <hr />
      {parkingLots
        .filter((parkingLot) => {
          if (searchQ)
            return parkingLot.lotName
              .toLowerCase()
              .includes(searchQ.toLowerCase());
          return parkingLot;
        })
        .map((lot) => (
          <div className={styles.lot} key={lot.lotName}>
            {!!lot.lotLocation ? (
              <Link
                href={lot.lotLocation}
                target="_blank"
                className={styles["gmap-link"]}
              >
                {lot.lotName}{" "}
                <Image
                  src={ExternalLink.src}
                  width={18}
                  height={18}
                  alt="open on google maps"
                />
              </Link>
            ) : (
              <div>{lot.lotName}</div>
            )}

            <div>
              <mark className={styles[getLotClassNameByCount(lot.spacesCount)]}>
                {lot.spacesCount}
              </mark>
            </div>
          </div>
        ))}
    </div>
  );
};

export default LotsList;
