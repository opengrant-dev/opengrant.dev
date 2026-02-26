import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiUrl = process.env.VITE_API_URL || 'http://localhost:8765'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: apiUrl,
        changeOrigin: true,
      },
      '/health': {
        target: apiUrl,
        changeOrigin: true,
      },
      '/badge': {
        target: apiUrl,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
