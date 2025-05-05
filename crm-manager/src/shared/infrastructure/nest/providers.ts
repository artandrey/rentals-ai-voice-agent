import { TwentyCrmAccommodationsMapper } from '~modules/crm/infrastructure/persistence/twenty-crm/mappers/twenty-crm-accommodations.mapper';
import { ClientsTwentyCrmMapper } from '~modules/crm/infrastructure/persistence/twenty-crm/mappers/twenty-crm-clients.mapper';
import { RentalsTwentyCrmMapper } from '~modules/crm/infrastructure/persistence/twenty-crm/mappers/twenty-crm-rentals.mapper';
import { TwentyCrmAccommodationsRepository } from '~modules/crm/infrastructure/persistence/twenty-crm/repositories/twenty-crm-accommodations.repository';
import { TwentyCrmClientsRepository } from '~modules/crm/infrastructure/persistence/twenty-crm/repositories/twenty-crm-clients.repository';
import { TwentyCrmRentalsRepository } from '~modules/crm/infrastructure/persistence/twenty-crm/repositories/twenty-crm-rentals.repository';

export const persistence = [
  TwentyCrmAccommodationsMapper,
  TwentyCrmAccommodationsMapper,
  TwentyCrmClientsRepository,
  TwentyCrmAccommodationsRepository,
  TwentyCrmClientsRepository,
  TwentyCrmRentalsRepository,
  ClientsTwentyCrmMapper,
  RentalsTwentyCrmMapper,
];
