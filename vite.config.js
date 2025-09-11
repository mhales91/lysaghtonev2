import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,  // This enables source maps for debugging
    minify: 'terser', // or 'esbuild' for faster builds
    rollupOptions: {
      output: {
        sourcemap: true, // Ensure source maps are generated
      }
    }
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }
  }
});
