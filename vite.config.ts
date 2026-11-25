/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves the site from /<repo-name>/.
// Override with VITE_BASE=/ for local preview or a custom domain.
const base = process.env.VITE_BASE ?? '/chess-vision-trainer/'

export default defineConfig({
  plugins: [react()],
  base,
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    setupFiles: ['tests/setup.ts'],
    globals: false,
  },
})
