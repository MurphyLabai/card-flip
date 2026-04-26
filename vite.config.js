import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3038,
    open: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
