import type { Metadata, Viewport } from "next";
import { Fira_Sans, Fira_Sans_Condensed } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import ServiceWorker from "@/components/service-worker";
import { captureInstallPromptScript } from "@/lib/install-prompt";

import "./globals.css";

const body = Fira_Sans({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const display = Fira_Sans_Condensed({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

const title = "Слободна паркинг места у Београду | Free parking spaces in Belgrade";
const description =
  "Број слободних места у јавним гаражама и на паркиралиштима Београда, освежава се сваког минута. | Live free spaces in Belgrade's public garages and parking lots.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description },
  applicationName: "ParkingBG",
  appleWebApp: { capable: true, title: "ParkingBG", statusBarStyle: "default" },
  authors: [
    {
      name: "Danilo Stojanovic",
      url: "https://github.com/danesto/available-parking-space-finder",
    },
  ],
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9edf2" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1621" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sr-Cyrl" className={`${body.variable} ${display.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: captureInstallPromptScript }} />
      </head>
      <body>
        {children}
        <ServiceWorker />
        <Analytics />
      </body>
    </html>
  );
}
