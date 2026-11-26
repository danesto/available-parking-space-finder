import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Слободна паркинг места Београд",
    short_name: "ParkingBG",
    description: "Live free spaces in Belgrade's public garages and parking lots.",
    lang: "sr",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    start_url: "/",
    theme_color: "#1d4f9f",
    background_color: "#e9edf2",
    icons: [
      { src: "/icons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/android-chrome-384x384.png", sizes: "384x384", type: "image/png" },
      { src: "/favicon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
