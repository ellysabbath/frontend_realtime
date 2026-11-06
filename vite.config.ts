import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    strictPort: true,   // ← fail if 5173 is taken, don't auto-switch
    open: true,         // ← optional: opens browser automatically
  },
})