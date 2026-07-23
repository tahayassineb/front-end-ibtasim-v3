import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { existsSync, createReadStream } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      // Serve /frames/ from the parent directory (d:/verde.ai/frames/)
      name: 'serve-frames',
      configureServer(server) {
        server.middlewares.use('/frames', (req, res, next) => {
          const filePath = path.resolve(__dirname, '../frames' + req.url)
          if (existsSync(filePath)) {
            res.setHeader('Content-Type', 'image/webp')
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
            createReadStream(filePath).pipe(res)
          } else {
            next()
          }
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('react-quill') || id.includes(`${path.sep}quill${path.sep}`)) {
            return 'editor'
          }

          if (id.includes('recharts')) {
            return 'charts'
          }

          if (id.includes(`${path.sep}convex${path.sep}`)) {
            return 'convex'
          }

          if (id.includes('react-router')) {
            return 'router'
          }

          if (id.includes(`${path.sep}react${path.sep}`) || id.includes('react-dom') || id.includes('scheduler')) {
            return 'react-vendor'
          }
        },
      },
    },
  },
  test: {
    exclude: ['tests/smoke/**', 'node_modules/**'],
  },
})
