import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

import { ISessionRepository } from '~modules/sessions/domain/repositories/session-repository.interface';
import { DrizzleSessionRepository } from '~modules/sessions/infrastructure/persistence/drizzle/repositories/drizzle-session.repoisotyr';
import { IDbContext } from '~shared/application/services/db-context.interface';

import { CoreToken } from 'src/core/constants';
import { SQLITE_DB } from 'src/lib/drizzle-sqlite';

@Injectable({ scope: Scope.REQUEST })
export class DrizzleDbContext implements IDbContext {
  protected _db: BetterSQLite3Database<any>;

  constructor(
    @Inject(SQLITE_DB) db: BetterSQLite3Database<any>,
    @Inject(CoreToken.APP_LOGGER) private readonly logger: Logger,
    @Inject(DrizzleSessionRepository)
    public readonly sessionRepository: DrizzleSessionRepository,
  ) {
    this._db = db;
    this.initRepositories();
  }

  public async commitTransaction(): Promise<void> {
    this.logger.warn(
      'Transaction was not committed: current db context implementation does not provide transaction functionality yet',
    );
  }
  public async rollbackTransaction(): Promise<void> {
    this.logger.warn(
      'Not transaction to rollback: current db context implementation does not provide transaction functionality yet',
    );
  }
  public async startTransaction(): Promise<void> {
    this.logger.warn(
      'Transaction was not started: current db context implementation does not provide transaction functionality yet',
    );
  }

  private initRepositories() {
    this.sessionRepository._setDatasource(this._db);
  }
}
