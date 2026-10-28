import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    // Native and Linux only: it stays out of the bundle and is loaded from node_modules when the app runs.
    rollupOptions: { external: ['@vencord/venmic'] },
  },
})
