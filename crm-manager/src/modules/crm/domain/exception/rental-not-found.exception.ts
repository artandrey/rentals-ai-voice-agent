import { NotFoundException } from '~core/exceptions/domain/exceptions/not-found-exception/not-found.exception';

import { RentalId } from '../entities/rental';

export class RentalNotFoundException extends NotFoundException {
  constructor(rentalId: RentalId) {
    super('RENTAL_NOT_FOUND', `Rental with ID ${rentalId} was not found`);
  }
}
