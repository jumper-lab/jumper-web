import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tracking from "./src/data/tracking.json";
import { principalTrackingTags } from "./src/tracking/bootstrap.mjs";

export default defineConfig(() => ({
  server: { host: "::", port: 8080 },
  plugins: [react(), {
    name: "izi-principal-tracking",
    transformIndexHtml: {
      order: "pre",
      handler: html => {
        if (/googletagmanager\.com\/(?:gtm\.js|ns\.html)|izi-principal-tracking/.test(html)) throw new Error("Carregador GTM duplicado no HTML principal.");
        return principalTrackingTags(tracking);
      },
    },
  }],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@cerrocora-attribution": path.resolve(__dirname, "../izigym-lp/src/checkout-attribution.ts"),
    },
  },
  build: {
    target: "es2020",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
}));
