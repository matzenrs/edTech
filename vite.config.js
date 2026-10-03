import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths, so the built site works from any host or folder.
  base: './',
  worker: { format: 'es' },
  build: { chunkSizeWarningLimit: 800 }, // Three.js is big, and that's OK
});
