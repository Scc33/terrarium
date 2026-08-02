import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  define: {
    /**
     * Whether the dev console exists in this build.
     *
     * Keyed off the vite COMMAND, not `import.meta.env.DEV`. That flag derives
     * from ambient `NODE_ENV`, so `NODE_ENV=test pnpm build` — exactly what
     * happens when a test or CI step shells out to the build — emits a
     * "production" bundle with the true-state inspector still inside it, and
     * `--mode production` does not override it. The command is what we
     * actually mean: `serve` is development, `build` ships.
     * Pinned by `tests/ui/dev-build-strip.test.ts`.
     */
    __DEV_TOOLS__: JSON.stringify(command === 'serve'),
  },
  worker: {
    format: 'es',
  },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: false,
  },
}))
