import { Injectable } from '@nestjs/common';

import { Rental } from '~modules/crm/domain/entities/rental';
import { RentalMapper } from '~modules/crm/domain/mappers/rental.mapper';
import { Query } from '~shared/application/CQS/query.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { CompactRentalDto } from '../dto/rental.dto';

export abstract class IGetRentalsQuery
  extends Query<void, CompactRentalDto[]>
  implements IUseCase<void, CompactRentalDto[]> {}

@Injectable()
export class GetRentalsQuery extends IGetRentalsQuery {
  constructor(private readonly rentalMapper: RentalMapper) {
    super();
  }

  async implementation(): Promise<CompactRentalDto[]> {
    const rentals = await this._dbContext.rentalsRepository.findAll();
    return rentals.map((rental) => this.rentalMapper.toCompactDto(rental));
  }
}
