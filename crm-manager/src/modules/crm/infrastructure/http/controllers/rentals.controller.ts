import { Controller, Get, Param } from '@nestjs/common';

import {
  CompactRentalDto,
  RentalEmergencyDetailsDto,
  RentalSettlementDetailsDto,
} from '~modules/crm/application/dto/rental.dto';
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

@Controller('rentals')
export class RentalsController {
  constructor(
    private readonly getRentalsQuery: IGetRentalsQuery,
    private readonly getRentalByIdQuery: IGetRentalByIdQuery,
    private readonly getRentalSettlementDetailsQuery: IGetRentalSettlementDetailsQuery,
    private readonly getRentalEmergencyDetailsQuery: IGetRentalEmergencyDetailsQuery,
  ) {}

  @Get()
  async getRentals(): Promise<CompactRentalDto[]> {
    return this.getRentalsQuery.execute();
  }

  @Get(':id')
  async getRentalById(@Param('id') id: string): Promise<CompactRentalDto> {
    const payload: GetRentalByIdPayload = {
      rentalId: id as RentalId,
    };

    return this.getRentalByIdQuery.execute(payload);
  }

  @Get(':id/settlement-details')
  async getRentalSettlementDetails(@Param('id') id: string): Promise<RentalSettlementDetailsDto> {
    const payload: GetRentalSettlementDetailsPayload = {
      rentalId: id as RentalId,
    };

    return this.getRentalSettlementDetailsQuery.execute(payload);
  }

  @Get(':id/emergency-details')
  async getRentalEmergencyDetails(@Param('id') id: string): Promise<RentalEmergencyDetailsDto> {
    const payload: GetRentalEmergencyDetailsPayload = {
      rentalId: id as RentalId,
    };

    return this.getRentalEmergencyDetailsQuery.execute(payload);
  }
}
