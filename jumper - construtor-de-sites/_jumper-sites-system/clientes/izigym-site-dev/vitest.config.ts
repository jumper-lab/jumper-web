import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: {
    "@": path.resolve(__dirname, "src"),
    "@cerrocora-attribution": path.resolve(__dirname, "../izigym-lp/src/checkout-attribution.ts"),
  } },
  test: { environment: "jsdom", environmentOptions: { jsdom: { url: "https://www.izigym.com.br/" } } },
});
