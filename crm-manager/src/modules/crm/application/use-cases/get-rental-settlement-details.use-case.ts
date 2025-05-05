import { Injectable } from '@nestjs/common';

import { RentalId } from '~modules/crm/domain/entities/rental';
import { RentalMapper } from '~modules/crm/domain/mappers/rental.mapper';
import { Query } from '~shared/application/CQS/query.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { RentalSettlementDetailsDto } from '../dto/rental.dto';

export interface GetRentalSettlementDetailsPayload {
  rentalId: RentalId;
}

export abstract class IGetRentalSettlementDetailsQuery
  extends Query<GetRentalSettlementDetailsPayload, RentalSettlementDetailsDto>
  implements IUseCase<GetRentalSettlementDetailsPayload, RentalSettlementDetailsDto> {}

@Injectable()
export class GetRentalSettlementDetailsQuery extends IGetRentalSettlementDetailsQuery {
  constructor(private readonly rentalMapper: RentalMapper) {
    super();
  }

  async implementation(): Promise<RentalSettlementDetailsDto> {
    const { rentalId } = this._input;
    const rental = await this._dbContext.rentalsRepository.findById(rentalId);

    if (!rental) {
      throw new Error('Rental not found');
    }

    return this.rentalMapper.toSettlementDetailsDto(rental);
  }
}
