import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Builds the framework-free embed runtime (src/embed/embed-entry.ts) into a
// single self-contained IIFE, served from /public/embed so the editor's
// "Export Embed" action can bundle it alongside a scene's JSON.
export default defineConfig({
  publicDir: false,
  build: {
    outDir: "public/embed",
    emptyOutDir: true,
    lib: {
      entry: fileURLToPath(new URL("./src/embed/embed-entry.ts", import.meta.url)),
      name: "ShaderfieldEmbed",
      formats: ["iife"],
      fileName: () => "shaderfield-embed.js",
    },
    minify: true,
  },
});
