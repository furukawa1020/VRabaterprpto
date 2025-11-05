import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three', '@pixiv/three-vrm'],
          'audio-vendor': ['tone'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', '@pixiv/three-vrm', 'tone'],
  },
});
