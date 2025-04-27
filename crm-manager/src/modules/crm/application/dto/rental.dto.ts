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
