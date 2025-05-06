import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

import { RentalId } from '~modules/crm/domain/entities/rental';
import { Amenity } from '~modules/crm/domain/value-objects/amenity.value';
import { Location } from '~modules/crm/domain/value-objects/location.value';
import { Price } from '~modules/crm/domain/value-objects/price.value';

export class LocationDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  houseNumber: string;

  @IsString()
  @IsNotEmpty()
  apparentNumber: string;
}

export class PriceDto {
  @IsNumber()
  @IsNotEmpty()
  amountMicros: number;

  @IsString()
  @IsNotEmpty()
  currencyCode: string;

  @IsNumber()
  @IsNotEmpty()
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
  @IsString()
  @IsNotEmpty()
  settlementDetails: string;
}

export class RentalEmergencyDetailsDto {
  @IsString()
  @IsNotEmpty()
  emergencyDetails: string;
}
