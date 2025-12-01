import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // so you can open it from mobile on same Wi-Fi
    port: 5173,
  },
});