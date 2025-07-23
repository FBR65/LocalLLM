import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  
  // Development Server für Electron
  server: {
    port: 5173,
    strictPort: false,
    host: 'localhost'
  },
  
  // Build Konfiguration für Electron
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  
  // Public Base Path für Electron
  base: './',
  
  // Optimierungen
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  
  // CSS Processing
  css: {
    postcss: './postcss.config.js'
  }
});
