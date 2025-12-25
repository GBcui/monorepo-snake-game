import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          core: ['@snake/core'],
          ui: ['@snake/ui']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@snake/core': path.resolve(__dirname, '../snake-core/src'),
      '@snake/ui': path.resolve(__dirname, '../snake-ui/src')
    }
  }
});