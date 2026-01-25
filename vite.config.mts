import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";
export default defineConfig({
  root: "src/renderer",
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@renderer": path.resolve(__dirname, "src/renderer")
    }
  },
  css:{
    postcss: {
      plugins: [tailwind(), autoprefixer()],
      
    },
  },
  server: {
    port: 5173
  },
  build: {
    outDir: "../../dist/renderer",
    emptyOutDir: true
  }
});

