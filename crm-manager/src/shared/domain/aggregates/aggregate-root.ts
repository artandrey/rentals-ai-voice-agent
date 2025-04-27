import { IDbContext, IDbRepositories } from '~shared/application/services/db-context.interface';

import { Entity } from '../entities/entity';

export class AggregateRoot<TId> extends Entity<TId> {
  protected _dbContext: IDbRepositories;
  _setContext(context: IDbRepositories) {
    this._dbContext = context;
  }
}
