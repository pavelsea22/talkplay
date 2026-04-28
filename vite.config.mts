import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        lessons:  resolve(__dirname, 'index.html'),
        activity: resolve(__dirname, 'activity/index.html'),
        demo:     resolve(__dirname, 'demo/index.html'),
        parent:   resolve(__dirname, 'parent/index.html'),
      },
    },
    outDir: 'dist/public',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/transcribe': 'http://localhost:3001',
      '/speak': 'http://localhost:3001',
    },
  },
});
