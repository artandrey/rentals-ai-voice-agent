import { DrizzleSessionMapper } from '~modules/sessions/infrastructure/persistence/drizzle/mappers/drizzle-session.mapper';
import { DrizzleSessionRepository } from '~modules/sessions/infrastructure/persistence/drizzle/repositories/drizzle-session.repoisotyr';

export const persistence = [DrizzleSessionRepository, DrizzleSessionMapper];
