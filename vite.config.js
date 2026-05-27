import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// vite.config.js stays as ESM since Vite expects it that way
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
