import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'client/index.ts',
    'client/client.gen.ts',
    'client/sdk.gen.ts',
    'client/types.gen.ts',
  ],
  outDir: 'dist/client',
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  tsconfig: 'tsconfig.json',
});
