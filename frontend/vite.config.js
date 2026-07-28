import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/register': 'http://127.0.0.1:5000',
      '/login': 'http://127.0.0.1:5000',
      '/destinations': 'http://127.0.0.1:5000',
      '/recommendations': 'http://127.0.0.1:5000',
      '/itineraries': 'http://127.0.0.1:5000',
      '/health': 'http://127.0.0.1:5000'
    }
  }
});
