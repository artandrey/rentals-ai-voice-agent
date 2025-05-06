import { Injectable } from '@nestjs/common';
import { RentalForResponse as RentalTwentyCrm } from 'twenty-crm-api-client';

import { Rental, RentalId } from '~modules/crm/domain/entities/rental';
import { Amenity } from '~modules/crm/domain/value-objects/amenity.value';
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
export class TwentyCrmRentalsMapper implements IDataAccessMapper<Rental, RentalTwentyCrm> {
  toPersistence(entity: Rental): RentalTwentyCrm {
    return {
      location: this.locationToPersistence(entity.location),
      pricePerDay: this.priceToPersistence(entity.pricePerDay),
      description: entity.description,
      settlementDetails: entity.settlementDetails,
      emergencyDetails: entity.emergencyDetails,
    };
  }

  toDomain(persistence: RentalTwentyCrm): Rental {
    const builder = Rental.builder(
      this.locationToDomain(persistence.location!),
      this.priceToDomain(persistence.pricePerDay!),
      persistence.description ?? '',
      this.amenitiesFromApi(persistence),
      persistence.settlementDetails ?? '',
      persistence.emergencyDetails ?? '',
    );

    if (persistence.id) {
      builder.id(persistence.id as RentalId);
    }

    return builder.build();
  }

  amenitiesFromApi(persistence: RentalTwentyCrm): Amenity[] {
    // Extract amenities from the API response
    // This is placeholder logic - adjust according to where amenities will be stored in the API
    const amenityTitles: string[] = [];

    // Example: If amenities are stored in custom fields or other properties
    // You'll need to implement the actual extraction logic based on API structure

    return amenityTitles.map((title) => Amenity.create(title));
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
