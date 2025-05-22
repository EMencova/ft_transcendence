import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  // server: {
  //   port: 5173,
  //   proxy: {
  //     '/api': 'http://localhost:3000', // Vite forwards API calls to Fastify
  //   },
  // },
})