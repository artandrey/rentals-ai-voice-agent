import type BetterSqlite3 from 'better-sqlite3';

// Define the options required by the DrizzleSqliteService
// Requires a url for the database file path
// Allows passing through optional config for the better-sqlite3 driver
export type DrizzleDbOptions = {
  url: string;
  config?: BetterSqlite3.Options;
};
