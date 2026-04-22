import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3030,
    open: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
