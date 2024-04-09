import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import type { Viewport } from "next";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Пронађи слободно место | Find available parking spot",
  description:
    "Слободна места на јавним паркиралиштима Београда | Available places in public parking lots in Belgrade",
  openGraph: {
    title: "Пронађи слободно место | Find available parking spot",
    description:
      "Слободна места на јавним паркиралиштима Београда | Available places in public parking lots in Belgrade",
  },
  manifest: "/manifest.json",
  authors: [
    { name: "Danilo Stojanovic" },
    {
      name: "Danilo Stojanovic",
      url: "https://github.com/danesto/available-parking-space-finder",
    },
  ],
  icons: [
    { rel: "apple-touch-icon", url: "icons/apple-touch-icon.png" },
    { rel: "icon", url: "icons/favicon-192x192.png" },
  ],
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#fff" }],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr">
      <body className={spaceGrotesk.className}>{children}</body>
    </html>
  );
}
