import { resolve } from 'path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '~modules': resolve(__dirname, './src/modules'),
      '~shared': resolve(__dirname, './src/shared'),
      '~core': resolve(__dirname, './src/core'),
      '~lib': resolve(__dirname, './src/lib'),
      '~': resolve(__dirname, './src'),
    },
  },
});
