/** @type {import('next').NextConfig} */
import pwa from "next-pwa";

const withPWA = pwa({
  dest: "public", // Destination directory for the PWA files
  disable: process.env.NODE_ENV === "development", // Disable PWA in development mode
  register: true, // Register the PWA service worker
  skipWaiting: true, // Skip waiting for service worker activation
});

const nextConfig = {
  logging: {
    fetches: true,
  },
};

export default withPWA(nextConfig);
