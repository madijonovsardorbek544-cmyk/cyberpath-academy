import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "pwa-192x192.png", "pwa-512x512.png", "apple-touch-icon.png"],
      manifest: {
        name: "CyberPath Academy",
        short_name: "CyberPath",
        description: "Adaptive cybersecurity learning from beginner to pro.",
        theme_color: "#0f172a",
        background_color: "#020617",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "apple-touch-icon.png", sizes: "180x180", type: "image/png" }
        ]
      }
    })
  ],
  server: {
    port: 5173
  }
});
