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
        timeout: 1800000, // 30 minutes
        proxyTimeout: 1800000, // 30 minutes
      },
      '/blob-proxy': {
        target: 'https://cererpblobdev.blob.core.windows.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/blob-proxy/, ''),
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
