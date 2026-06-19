import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "app/wc/index.ts"),
      name: "LitComponents",
      fileName: "wc",
      formats: ["es", "iife"],
    },
    outDir: "demo/dist",
    emptyOutDir: true,
  },
});
