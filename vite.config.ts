import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['sharp', 'electron'],
            },
          },
          plugins: [
            {
              name: 'copy-preload-cjs',
              closeBundle() {
                // Ensure dist-electron exists and copy the native preload.cjs
                fs.mkdirSync('dist-electron', { recursive: true });
                fs.copyFileSync('electron/preload.cjs', 'dist-electron/preload.cjs');
              },
            },
          ],
        },
      },
    ]),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
