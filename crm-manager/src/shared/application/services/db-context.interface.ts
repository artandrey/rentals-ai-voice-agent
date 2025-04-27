import { ISessionRepository } from '~modules/sessions/domain/repositories/session-repository.interface';

export interface IDbContext {
  startTransaction(): Promise<void>;

  commitTransaction(): Promise<void>;

  rollbackTransaction(): Promise<void>;
}

export interface IDbRepositories {}

export interface IDbContext extends IDbRepositories {
  startTransaction(): Promise<void>;

  commitTransaction(): Promise<void>;

  rollbackTransaction(): Promise<void>;

  readonly sessionRepository: ISessionRepository;
}
