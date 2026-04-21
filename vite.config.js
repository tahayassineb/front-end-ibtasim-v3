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
  },
})
