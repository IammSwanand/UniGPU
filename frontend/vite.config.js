import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('@fortawesome')) return 'fontawesome'
          if (id.includes('@cloudinary')) return 'cloudinary'
          if (id.includes('react')) return 'react-vendor'

          return 'vendor'
        },
      },
    },
  },
})
