import { defaultPlugins, defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './schema.json',
  output: {
    path: './client',
    clean: true,
  },
  plugins: [
    ...defaultPlugins,
    { name: '@hey-api/client-axios' },
    {
      asClass: true,
      name: '@hey-api/sdk',
    },
  ],
});
