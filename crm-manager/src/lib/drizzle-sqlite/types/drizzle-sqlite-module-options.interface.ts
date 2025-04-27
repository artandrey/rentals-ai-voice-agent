import { DrizzleDbOptions } from '../services/drizzle-sqlite/drizzle-db-options';

export interface IDrizzleSqliteModuleOptions {
  db: DrizzleDbOptions;
  schema: Record<string, unknown>;
}
