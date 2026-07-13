import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages serves project sites from /<repo-name>/, so the CI build sets GITHUB_PAGES_BASE
  // to that subpath; local dev and `vite preview` fall back to the site root.
  base: process.env.GITHUB_PAGES_BASE ?? "/",
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
