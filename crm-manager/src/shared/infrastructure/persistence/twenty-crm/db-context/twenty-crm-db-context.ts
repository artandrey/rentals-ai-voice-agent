import { Inject, Injectable, Scope } from '@nestjs/common';

import { CoreToken } from '~core/constants';
import { ILogger } from '~core/logger/application/services/logger.interface';
import { IAccommodationRepository } from '~modules/crm/domain/repositories/accommodations-repository.interface';
import { IClientRepository } from '~modules/crm/domain/repositories/clients-repository.interface';
import { IRentalsRepository } from '~modules/crm/domain/repositories/rentals-repository.interface';
import { TwentyCrmAccommodationsRepository } from '~modules/crm/infrastructure/persistence/twenty-crm/repositories/twenty-crm-accommodations.repository';
import { TwentyCrmClientsRepository } from '~modules/crm/infrastructure/persistence/twenty-crm/repositories/twenty-crm-clients.repository';
import { TwentyCrmRentalsRepository } from '~modules/crm/infrastructure/persistence/twenty-crm/repositories/twenty-crm-rentals.repository';
import { IDbContext } from '~shared/application/services/db-context.interface';

@Injectable({ scope: Scope.REQUEST })
export class TwentyCrmDbContext implements IDbContext {
  constructor(@Inject(CoreToken.APP_LOGGER) private readonly logger: ILogger) {}

  public async startTransaction(): Promise<void> {
    this.logger.warn(
      'Transaction was not committed: current db context implementation does not provide transaction functionality yet',
    );
  }

  public async commitTransaction(): Promise<void> {
    this.logger.warn(
      'Transaction was not committed: current db context implementation does not provide transaction functionality yet',
    );
  }

  public async rollbackTransaction(): Promise<void> {
    this.logger.warn(
      'Transaction was not committed: current db context implementation does not provide transaction functionality yet',
    );
  }

  @Inject(TwentyCrmClientsRepository)
  public clientsRepository: IClientRepository;
  @Inject(TwentyCrmRentalsRepository)
  public rentalsRepository: IRentalsRepository;
  @Inject(TwentyCrmAccommodationsRepository)
  public accommodationsRepository: IAccommodationRepository;
}
