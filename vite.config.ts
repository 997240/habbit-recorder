import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// @ts-ignore
const PUBLIC_URL = process?.env?.PUBLIC_URL;

// https://vitejs.dev/config/
export default defineConfig({
  base: PUBLIC_URL || '/habbit-recorder/', 
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
