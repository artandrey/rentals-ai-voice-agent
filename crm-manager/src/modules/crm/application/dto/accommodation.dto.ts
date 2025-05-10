import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Max, Min, ValidateNested } from 'class-validator';

import { CompactRentalDto } from './rental.dto';

export class DateDayDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1900)
  @Max(2100)
  year: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(12)
  month: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(31)
  day: number;
}

export class BookRentalDto {
  @IsString()
  @IsNotEmpty()
  rentalId: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ValidateNested()
  @Type(() => DateDayDto)
  @IsNotEmpty()
  startDate: DateDayDto;

  @ValidateNested()
  @Type(() => DateDayDto)
  @IsNotEmpty()
  endDate: DateDayDto;
}

export class ClientAccommodationDto {
  id: string;
  clientId: string;
  rentalId: string;
  startDate: DateDayDto;
  endDate: DateDayDto;
  status: string;
  rental: CompactRentalDto;
}

export class SettlementConfirmationDto {
  @IsString()
  @IsNotEmpty()
  accommodationId: string;
}
