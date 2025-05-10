import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { SettlementConfirmationDto } from '~modules/crm/application/dto/accommodation.dto';
import { BookRentalDto } from '~modules/crm/application/dto/accommodation.dto';
import { IConfirmSettlementUseCase } from '~modules/crm/application/use-cases/confirm-settlement.use-case';
import { ICreateBookingUseCase } from '~modules/crm/application/use-cases/create-booking.use-case';
import { AccommodationId } from '~modules/crm/domain/entities/accommodation';

@Controller('accommodations')
export class AccommodationsController {
  constructor(
    private readonly createBookingUseCase: ICreateBookingUseCase,
    private readonly confirmSettlementUseCase: IConfirmSettlementUseCase,
  ) {}

  @Post()
  async createBooking(@Body() body: BookRentalDto): Promise<void> {
    await this.createBookingUseCase.execute(body);
  }

  @Post(':id/confirm-settlement')
  async confirmSettlement(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const payload: SettlementConfirmationDto = {
      accommodationId: id as AccommodationId,
    };

    await this.confirmSettlementUseCase.execute(payload);
  }
}
