import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Plugin to replace base path in HTML for public assets
const htmlBasePathPlugin = () => {
  return {
    name: 'html-base-path',
    transformIndexHtml(html) {
      const basePath = process.env.VITE_BASE_PATH || '/'
      // Replace absolute paths for favicons and other public assets
      return html
        .replace(/href="\/favicon/g, `href="${basePath}favicon`)
        .replace(/href="\/logo/g, `href="${basePath}logo`)
    }
  }
}

export default defineConfig({
  plugins: [react(), htmlBasePathPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['gapi', 'gapi.auth2'],
  },
  define: {
    global: 'globalThis',
  },
  // Base path for deployment to subdirectories (e.g., /app/)
  // Set VITE_BASE_PATH environment variable if deploying to a subdirectory
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    // Generate source maps for production debugging (optional)
    sourcemap: false,
    // Copy public folder files to dist root (Vite does this automatically)
    // Files in public/ are copied to dist/ during build
    copyPublicDir: true,
    // Warn if chunk exceeds 1MB
    chunkSizeWarningLimit: 1000,
    // Optimize chunk size
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'lucide-icons': ['lucide-react'],
        },
      },
    },
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging, set to true in production if needed
      },
    },
  },
})

