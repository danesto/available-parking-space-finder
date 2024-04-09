import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
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
