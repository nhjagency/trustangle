import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so a built bundle can be served from any sub-path
// (GitHub Pages project site, an /tracker/ folder on the main host, file://).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Client logos live in src/logos/ and are small. Inlining them as data
    // URIs keeps the single-file preview bundle (qa/bundle-single-file.mjs)
    // genuinely self-contained. Anything larger is emitted as a normal asset.
    assetsInlineLimit: 512 * 1024,
  },
});
