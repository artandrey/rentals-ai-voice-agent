import { ClientId } from '~modules/crm/domain/entities/client';
import { RentalId } from '~modules/crm/domain/entities/rental';
import { DayDate } from '~modules/crm/domain/value-objects/day-date.value';
import { Command } from '~shared/application/CQS/command.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { BookRentalDto } from '../dto/accommodation.dto';

export abstract class ICreateBookingUseCase
  extends Command<BookRentalDto, void>
  implements IUseCase<BookRentalDto, void> {}

export class CreateBookingUseCase extends ICreateBookingUseCase {
  constructor() {
    super();
  }

  async implementation(): Promise<void> {
    const { rentalId, clientId, startDate, endDate } = this._input;

    const rental = await this._dbContext.rentalsRepository.findById(rentalId as RentalId);

    if (!rental) {
      throw new Error('Rental not found');
    }

    const client = await this._dbContext.clientsRepository.findById(clientId as ClientId);

    if (!client) {
      throw new Error('Client not found');
    }

    rental.createAccommodation(
      client.id,
      new DayDate(startDate.year, startDate.month, startDate.day),
      new DayDate(endDate.year, endDate.month, endDate.day),
    );

    await this._dbContext.rentalsRepository.save(rental);
  }
}
