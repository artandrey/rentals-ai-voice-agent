import { Injectable, Scope } from '@nestjs/common';

import { AccommodationId } from '~modules/crm/domain/entities/accommodation';
import { ClientId } from '~modules/crm/domain/entities/client';
import { RentalId } from '~modules/crm/domain/entities/rental';
import { DayDate } from '~modules/crm/domain/value-objects/day-date.value';
import { Command } from '~shared/application/CQS/command.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { BookRentalDto, BookingResultDto } from '../dto/accommodation.dto';

export abstract class ICreateBookingUseCase
  extends Command<BookRentalDto, BookingResultDto>
  implements IUseCase<BookRentalDto, BookingResultDto> {}

@Injectable({ scope: Scope.REQUEST })
export class CreateBookingUseCase extends ICreateBookingUseCase {
  constructor() {
    super();
  }

  async implementation(): Promise<BookingResultDto> {
    const { rentalId, clientId, startDate, endDate } = this._input;

    const rental = await this._dbContext.rentalsRepository.findById(rentalId as RentalId);

    if (!rental) {
      throw new Error('Rental not found');
    }

    const client = await this._dbContext.clientsRepository.findById(clientId as ClientId);

    if (!client) {
      throw new Error('Client not found');
    }

    const accommodationId = await rental.createAccommodation(
      client.id,
      new DayDate(startDate.year, startDate.month, startDate.day),
      new DayDate(endDate.year, endDate.month, endDate.day),
    );

    await this._dbContext.rentalsRepository.save(rental);
    const accommodation = await this._dbContext.accommodationsRepository.findById(accommodationId);

    if (!accommodation) {
      throw new Error('Accommodation not found');
    }

    return {
      id: accommodation.id,
      clientId: accommodation.clientId,
      rentalId: accommodation.rentalId,
      startDate: accommodation.startDate.toISODateString(),
      endDate: accommodation.endDate.toISODateString(),
    };
  }
}
