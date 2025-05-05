import { TwentyCrmAccommodationsMapper } from '~modules/crm/infrastructure/persistence/twenty-crm/mappers/twenty-crm-accommodations.mapper';
import { TwentyCrmCallsMapper } from '~modules/crm/infrastructure/persistence/twenty-crm/mappers/twenty-crm-calls.mapper';
import { TwentyCrmClientsMapper } from '~modules/crm/infrastructure/persistence/twenty-crm/mappers/twenty-crm-clients.mapper';
import { TwentyCrmRentalsMapper } from '~modules/crm/infrastructure/persistence/twenty-crm/mappers/twenty-crm-rentals.mapper';
import { TwentyCrmAccommodationsRepository } from '~modules/crm/infrastructure/persistence/twenty-crm/repositories/twenty-crm-accommodations.repository';
import { TwentyCrmCallsRepository } from '~modules/crm/infrastructure/persistence/twenty-crm/repositories/twenty-crm-calls.repository';
import { TwentyCrmClientsRepository } from '~modules/crm/infrastructure/persistence/twenty-crm/repositories/twenty-crm-clients.repository';
import { TwentyCrmRentalsRepository } from '~modules/crm/infrastructure/persistence/twenty-crm/repositories/twenty-crm-rentals.repository';

export const persistence = [
  TwentyCrmAccommodationsMapper,
  TwentyCrmAccommodationsMapper,
  TwentyCrmClientsRepository,
  TwentyCrmAccommodationsRepository,
  TwentyCrmClientsRepository,
  TwentyCrmRentalsRepository,
  TwentyCrmClientsMapper,
  TwentyCrmRentalsMapper,
  TwentyCrmCallsRepository,
  TwentyCrmCallsMapper,
];
