import { Injectable } from '@nestjs/common';
import {
  // Use for update
  status as AccommodationStatusTwentyCrm,
  Accommodation as AccommodationTwentyCrmInput,
  // Use for create
  Accommodation_for_Response as AccommodationTwentyCrmResponse,
  // Use for read
  Accommodation_for_Update as AccommodationTwentyCrmUpdate,
} from 'twenty-crm-api-client';

import { Accommodation, AccommodationId, AccommodationStatus } from '~modules/crm/domain/entities/accommodation';
import { Client, ClientId } from '~modules/crm/domain/entities/client';
import { Rental, RentalId } from '~modules/crm/domain/entities/rental';
import { DayDate } from '~modules/crm/domain/value-objects/day-date.value';
import { IDataAccessMapper } from '~shared/domain/mappers/data-access-mapper.interface';

@Injectable()
export class TwentyCrmAccommodationsMapper implements IDataAccessMapper<Accommodation, AccommodationTwentyCrmResponse> {
  toPersistence(entity: Accommodation): AccommodationTwentyCrmResponse {
    return {
      clientId: entity.clientId,
      rentalId: entity.rentalId,
      startdate: entity.startDate.toISODateString(),
      enddate: entity.endDate.toISODateString(),
      status: entity.status,
    };
  }

  toDomain(persistence: AccommodationTwentyCrmResponse): Accommodation {
    return Accommodation.builder(
      persistence.clientId as ClientId,
      persistence.rentalId as RentalId,
      DayDate.fromISODateString(persistence.startdate!),
      DayDate.fromISODateString(persistence.enddate!),
    )
      .status(persistence.status as AccommodationStatus)
      .id(persistence.id as AccommodationId)
      .build();
  }
}
