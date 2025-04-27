import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/shared/infrastructure/persistence/drizzle/schema/migration-schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_URL!,
  },
  verbose: true,
  strict: true,
  out: process.env.DD_MIGRATIONS_DIR ?? './src/shared/infrastructure/persistence/drizzle/migrations',
  introspect: { casing: 'camel' },
});
