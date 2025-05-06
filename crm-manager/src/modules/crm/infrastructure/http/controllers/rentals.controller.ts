import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';

import {
  AvailableDateSpansDto,
  CompactRentalDto,
  RentalEmergencyDetailsDto,
  RentalSettlementDetailsDto,
} from '~modules/crm/application/dto/rental.dto';
import {
  GetRentalAvailableDateSpansPayload,
  IGetRentalAvailableDateSpansQuery,
} from '~modules/crm/application/use-cases/get-rental-available-date-spans.use-case';
import {
  GetRentalByIdPayload,
  IGetRentalByIdQuery,
} from '~modules/crm/application/use-cases/get-rental-by-id.use-case';
import {
  GetRentalEmergencyDetailsPayload,
  IGetRentalEmergencyDetailsQuery,
} from '~modules/crm/application/use-cases/get-rental-emergency-details.use-case';
import {
  GetRentalSettlementDetailsPayload,
  IGetRentalSettlementDetailsQuery,
} from '~modules/crm/application/use-cases/get-rental-settlement-details.use-case';
import { IGetRentalsQuery } from '~modules/crm/application/use-cases/get-rentals.use-case';
import { RentalId } from '~modules/crm/domain/entities/rental';

import { DateValidationPipe } from '../pipes/date-validation.pipe';

@Controller('rentals')
export class RentalsController {
  constructor(
    private readonly getRentalsQuery: IGetRentalsQuery,
    private readonly getRentalByIdQuery: IGetRentalByIdQuery,
    private readonly getRentalSettlementDetailsQuery: IGetRentalSettlementDetailsQuery,
    private readonly getRentalEmergencyDetailsQuery: IGetRentalEmergencyDetailsQuery,
    private readonly getRentalAvailableDateSpansQuery: IGetRentalAvailableDateSpansQuery,
  ) {}

  @Get()
  async getRentals(): Promise<CompactRentalDto[]> {
    return this.getRentalsQuery.execute();
  }

  @Get(':id')
  async getRentalById(@Param('id', ParseUUIDPipe) id: string): Promise<CompactRentalDto> {
    const payload: GetRentalByIdPayload = {
      rentalId: id as RentalId,
    };

    return this.getRentalByIdQuery.execute(payload);
  }

  @Get(':id/settlement-details')
  async getRentalSettlementDetails(@Param('id', ParseUUIDPipe) id: string): Promise<RentalSettlementDetailsDto> {
    const payload: GetRentalSettlementDetailsPayload = {
      rentalId: id as RentalId,
    };

    return this.getRentalSettlementDetailsQuery.execute(payload);
  }

  @Get(':id/emergency-details')
  async getRentalEmergencyDetails(@Param('id', ParseUUIDPipe) id: string): Promise<RentalEmergencyDetailsDto> {
    const payload: GetRentalEmergencyDetailsPayload = {
      rentalId: id as RentalId,
    };

    return this.getRentalEmergencyDetailsQuery.execute(payload);
  }

  @Get(':id/available-dates')
  async getRentalAvailableDateSpans(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate', DateValidationPipe) startDate: string,
    @Query('endDate', DateValidationPipe) endDate: string,
  ): Promise<AvailableDateSpansDto> {
    const payload: GetRentalAvailableDateSpansPayload = {
      rentalId: id as RentalId,
      startDate,
      endDate,
    };

    return this.getRentalAvailableDateSpansQuery.execute(payload);
  }
}
