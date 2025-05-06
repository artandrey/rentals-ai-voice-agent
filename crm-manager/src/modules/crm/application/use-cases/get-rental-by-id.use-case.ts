import { Injectable, Scope } from '@nestjs/common';

import { RentalId } from '~modules/crm/domain/entities/rental';
import { RentalMapper } from '~modules/crm/domain/mappers/rental.mapper';
import { Query } from '~shared/application/CQS/query.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { CompactRentalDto } from '../dto/rental.dto';

export interface GetRentalByIdPayload {
  rentalId: RentalId;
}

export abstract class IGetRentalByIdQuery
  extends Query<GetRentalByIdPayload, CompactRentalDto>
  implements IUseCase<GetRentalByIdPayload, CompactRentalDto> {}

@Injectable({ scope: Scope.REQUEST })
export class GetRentalByIdQuery extends IGetRentalByIdQuery {
  constructor(private readonly rentalMapper: RentalMapper) {
    super();
  }

  async implementation(): Promise<CompactRentalDto> {
    const { rentalId } = this._input;
    const rental = await this._dbContext.rentalsRepository.findById(rentalId);

    if (!rental) {
      throw new Error('Rental not found');
    }

    return this.rentalMapper.toCompactDto(rental);
  }
}
