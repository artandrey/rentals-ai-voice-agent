import { Injectable } from '@nestjs/common';
import { Rental_for_Response as RentalTwentyCrm } from 'twenty-crm-api-client';

import { Rental } from '~modules/crm/domain/entities/rental';
import { Location } from '~modules/crm/domain/value-objects/location.value';
import { Price } from '~modules/crm/domain/value-objects/price.value';
import { IDataAccessMapper } from '~shared/domain/mappers/data-access-mapper.interface';

export interface ITwentyCrmLocation {
  addressStreet1?: string;
  addressStreet2?: string;
  addressCity?: string;
  addressPostcode?: string;
  addressState?: string;
  addressCountry?: string;
  addressLat?: number;
  addressLng?: number;
}

export interface ITwentyCrmPrice {
  amountMicros?: number;
  currencyCode?: string;
}

@Injectable()
export class RentalsTwentyCrmMapper implements IDataAccessMapper<Rental, RentalTwentyCrm> {
  toPersistence(entity: Rental): RentalTwentyCrm {
    return {
      location: this.locationToPersistence(entity.location),
      pricePerDay: this.priceToPersistence(entity.pricePerDay),
    };
  }
  toDomain(persistence: RentalTwentyCrm): Rental {
    return Rental.builder(
      this.locationToDomain(persistence.location!),
      this.priceToDomain(persistence.pricePerDay!),
    ).build();
  }

  locationToPersistence(location: Location): ITwentyCrmLocation {
    return {
      addressCity: location.city,
      addressStreet1: `${location.street}; ${location.houseNumber}; ${location.apparentNumber}`,
    };
  }

  locationToDomain(persistence: ITwentyCrmLocation): Location {
    const [street = '', houseNumber = '', apparentNumber = ''] = persistence.addressStreet1?.split(';') ?? [];
    return new Location(street.trim(), houseNumber.trim(), apparentNumber.trim());
  }

  priceToPersistence(price: Price): ITwentyCrmPrice {
    return {
      amountMicros: price.amountMicros,
      currencyCode: price.currency,
    };
  }

  priceToDomain(persistence: ITwentyCrmPrice): Price {
    return new Price(persistence.amountMicros ?? 0, persistence.currencyCode ?? '');
  }
}
