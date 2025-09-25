/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/frontend',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4200,
    host: 'localhost',
  },
  plugins: [react()],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          'react-vendor': ['react', 'react-dom'],
          'react-router': ['react-router-dom'],
          'react-query': ['@tanstack/react-query'],
          'redux': ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
          'ui-libs': ['dayjs', 'libphonenumber-js'],
          'react-dropzone': ['react-dropzone'],
          'react-image-crop': ['react-image-crop'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@reduxjs/toolkit',
      'react-redux',
      'redux-persist',
      'dayjs',
      'libphonenumber-js',
      'react-dropzone',
      'react-image-crop',
    ],
  },
}));
