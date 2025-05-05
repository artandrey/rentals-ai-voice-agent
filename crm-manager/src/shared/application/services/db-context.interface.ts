import { IAccommodationRepository } from '~modules/crm/domain/repositories/accommodations-repository.interface';
import { ICallsRepository } from '~modules/crm/domain/repositories/call-repository.interface';
import { IClientRepository } from '~modules/crm/domain/repositories/clients-repository.interface';
import { IRentalsRepository } from '~modules/crm/domain/repositories/rentals-repository.interface';

export interface IDbContext {
  startTransaction(): Promise<void>;

  commitTransaction(): Promise<void>;

  rollbackTransaction(): Promise<void>;
}

export interface IDbRepositories {
  accommodationsRepository: IAccommodationRepository;
  clientsRepository: IClientRepository;
  rentalsRepository: IRentalsRepository;
  callsRepository: ICallsRepository;
}

export interface IDbContext extends IDbRepositories {
  startTransaction(): Promise<void>;

  commitTransaction(): Promise<void>;

  rollbackTransaction(): Promise<void>;
}
