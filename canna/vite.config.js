import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://relentless-billionaire-api.tge40000.workers.dev',
        changeOrigin: true,
        secure: true
      }
    }
  }
});
