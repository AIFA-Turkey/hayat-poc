import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/flowai',
  define: {
    global: 'globalThis',
  },
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api/flowai': {
        target: 'https://www.cerebroaifalabs.com',
        changeOrigin: true,
        secure: false,
        timeout: 1200000, // 10 minutes
        proxyTimeout: 1200000, // 10 minutes
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
})
