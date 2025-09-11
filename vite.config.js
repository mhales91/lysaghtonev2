import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,  // This enables source maps for debugging
    minify: 'esbuild', // Use esbuild instead of terser (faster and built-in)
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }
  }
});
