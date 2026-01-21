import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Plugin to replace base path in HTML and manifest for public assets
const htmlBasePathPlugin = () => {
  const basePath = process.env.VITE_BASE_PATH || '/'
  
  return {
    name: 'html-base-path',
    transformIndexHtml(html) {
      // Replace absolute paths for favicons and other public assets
      return html
        .replace(/href="\/favicon/g, `href="${basePath}favicon`)
        .replace(/href="\/logo/g, `href="${basePath}logo`)
        .replace(/href="\/manifest\.json"/g, `href="${basePath}manifest.json"`)
    },
    closeBundle() {
      // Update manifest.json with base path after build
      if (basePath !== '/') {
        const manifestPath = path.resolve(__dirname, 'dist/manifest.json')
        if (fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
          
          // Update start_url and scope
          manifest.start_url = basePath
          manifest.scope = basePath
          
          // Update icon paths
          if (manifest.icons) {
            manifest.icons = manifest.icons.map(icon => ({
              ...icon,
              src: icon.src.startsWith('/') ? basePath + icon.src.slice(1) : icon.src
            }))
          }
          
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    htmlBasePathPlugin(),
    // Gzip compression
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // Only compress files larger than 10KB
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false
    }),
    // Brotli compression (better than gzip)
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
      deleteOriginFile: false
    })
  ],
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
    // Warn if chunk exceeds 500KB (reduced from 1MB for better performance)
    chunkSizeWarningLimit: 500,
    // Optimize chunk size and code splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            if (id.includes('lucide-react')) {
              return 'lucide-icons'
            }
            // Other node_modules into a single vendor chunk
            return 'vendor'
          }
          // Component-based code splitting
          if (id.includes('/components/ui/')) {
            return 'ui-components'
          }
          if (id.includes('/components/')) {
            return 'components'
          }
          if (id.includes('/services/')) {
            return 'services'
          }
        },
        // Optimize asset naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Minify for production with optimized settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
        passes: 2, // Run compression twice for better results
      },
      mangle: {
        safari10: true, // Fix Safari 10+ compatibility
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    // Target modern browsers for smaller bundles
    target: 'es2015',
    // CSS minification
    cssMinify: true,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Increase chunk size for better compression
    assetsInlineLimit: 4096, // Inline assets < 4KB as base64
  },
})

