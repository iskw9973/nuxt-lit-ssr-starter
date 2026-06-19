import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  // public/ を配布物にコピーさせない（favicon 等の混入防止）。
  publicDir: false,
  build: {
    lib: {
      entry: resolve(__dirname, "app/wc/index.ts"),
      fileName: "wc",
      formats: ["es"],
    },
    outDir: "demo/dist",
    emptyOutDir: true,
  },
});
