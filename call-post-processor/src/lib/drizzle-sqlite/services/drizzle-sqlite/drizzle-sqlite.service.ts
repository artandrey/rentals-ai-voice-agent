import { Injectable } from '@nestjs/common';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';

import { DrizzleDbOptions } from './drizzle-db-options';

@Injectable()
export class DrizzleSqliteService {
  public getDrizzle(
    options: DrizzleDbOptions,
    schema?: Record<string, unknown>,
  ): BetterSQLite3Database<Record<string, unknown>> {
    if (!options.url) {
      throw new Error('SQLite database URL is required in options.url');
    }
    return drizzle(options.url, { schema });
  }
}
