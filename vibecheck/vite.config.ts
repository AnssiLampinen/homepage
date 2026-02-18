import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: This ensures assets use relative paths (e.g., "./assets/...")
  // allowing the app to run in a subdirectory like mywebsite.com/vibecheck
  base: './',
});