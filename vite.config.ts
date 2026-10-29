import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile"

// SINGLE=1 pnpm build → one self-contained index.html for sharing the prototype
const single = process.env.SINGLE === "1"

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile()] : [])],
  build: single ? { modulePreload: false, cssCodeSplit: false, rollupOptions: { output: { format: "iife", inlineDynamicImports: true } } } : undefined,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
   server: {
    allowedHosts: [".trycloudflare.com"],
  },
})
