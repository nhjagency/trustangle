import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so a built bundle can be served from any sub-path
// (GitHub Pages project site, an /tracker/ folder on the main host, file://).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: true },
});
