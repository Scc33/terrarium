import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: process.env.ARCHITECTURE_PORT ? Number(process.env.ARCHITECTURE_PORT) : 4174,
    strictPort: false,
  },
})
