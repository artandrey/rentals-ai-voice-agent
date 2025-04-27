import { int, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { SessionId } from '~modules/sessions/domain/entities/session.entity';

export const sessions = sqliteTable('sessions', {
  id: int('id').primaryKey({ autoIncrement: true }).$type<SessionId>(),
  preferredLanguage: text('preferred_language').notNull(),
  preferredCurrency: text('preferred_currency').notNull(),
  telegramUserId: integer('telegram_user_id'),
});
