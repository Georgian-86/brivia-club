import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // '/' everywhere real (Render, Vercel, custom domain); the GitHub Pages
  // demo is the odd one out and builds with VITE_BASE=/brivia-club/
  base: process.env.VITE_BASE || '/',
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
