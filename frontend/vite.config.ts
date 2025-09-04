import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      // Ensure all routes are handled by index.html in production
      input: {
        main: './index.html',
      }
    }
  },
  // server: {
  //   port: 5173,
  //   proxy: {
  //     '/api': 'http://localhost:3000', // Vite forwards API calls to Fastify
  //   },
  // },
})