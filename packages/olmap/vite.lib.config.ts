import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    emptyOutDir: false,
    target: 'es2022',
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(root, 'src/index.ts'),
        dom: resolve(root, 'src/presentation/dom.ts'),
        legacy: resolve(root, 'src/legacy/bootstrap.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
