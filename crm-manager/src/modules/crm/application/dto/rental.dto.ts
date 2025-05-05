import { RentalId } from '~modules/crm/domain/entities/rental';
import { Amenity } from '~modules/crm/domain/value-objects/amenity.value';
import { Location } from '~modules/crm/domain/value-objects/location.value';
import { Price } from '~modules/crm/domain/value-objects/price.value';

export class LocationDto {
  street: string;
  houseNumber: string;
  apparentNumber: string;
}
export class PriceDto {
  amountMicros: number;
  currencyCode: string;
  amountDecimal: number;
}
export class RentalDto {
  location: LocationDto;
  pricePerDay: PriceDto;
}

export class CompactRentalDto {
  id: RentalId;
  price: Price;
  description: string;
  location: Location;
  amenities: Amenity[];
}

export class RentalSettlementDetailsDto {
  settlementDetails: string;
}

export class RentalEmergencyDetailsDto {
  emergencyDetails: string;
}
