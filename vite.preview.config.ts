// Temporary config used to preview the renderer in a plain browser (no Electron).
// Not part of the app build — remove after the visual check.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
