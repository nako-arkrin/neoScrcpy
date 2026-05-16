import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const r = (p: string) => path.resolve(__dirname, p);

export default defineConfig({
  root: "src",
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: r("src/pages/popup/index.html"),
        sidepanel: r("src/pages/sidepanel/index.html"),
        options: r("src/pages/options/index.html"),
        permission: r("src/pages/permission/index.html"),
        pip: r("src/pages/pip/index.html"),
        welcome: r("src/pages/welcome/index.html"),
        background: r("src/background.ts")
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "background") return "background.js";
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/chunk-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
