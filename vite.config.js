import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // '/brivia-club/' for the GitHub Pages demo; Render builds with VITE_BASE=/
  base: process.env.VITE_BASE || '/brivia-club/',
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': 'http://localhost:4200',
      '/socket.io': { target: 'http://localhost:4200', ws: true },
    },
  },
})
