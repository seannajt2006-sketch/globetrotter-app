import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/users': {
        target: process.env.VITE_API_GATEWAY_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/register': {
        target: process.env.VITE_API_GATEWAY_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/login': {
        target: process.env.VITE_API_GATEWAY_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/itineraries': {
        target: process.env.VITE_API_GATEWAY_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/recommendations': {
        target: process.env.VITE_API_GATEWAY_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/destinations': {
        target: process.env.VITE_API_GATEWAY_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/comments': {
        target: process.env.VITE_API_GATEWAY_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/chat': {
        target: process.env.VITE_API_GATEWAY_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_COMMUNITY_SERVICE_URL || 'http://localhost:5004',
        changeOrigin: true,
        ws: true,
      },
      '/health': {
        target: process.env.VITE_API_GATEWAY_URL || 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
});
