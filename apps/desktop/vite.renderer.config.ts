import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react(), tsconfigPaths()],
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: false,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
    open: false,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});

