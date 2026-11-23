import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/restaurant': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/restaurant-management': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/customer': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/cart': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/checkout': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/coupons': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/orders': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/delivery-partner': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/fleet-manager': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/payments': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/finance': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/reviews': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ai': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
