import { Injectable, Scope } from '@nestjs/common';

import { RentalId } from '~modules/crm/domain/entities/rental';
import { RentalNotFoundException } from '~modules/crm/domain/exception/rental-not-found.exception';
import { RentalMapper } from '~modules/crm/domain/mappers/rental.mapper';
import { Query } from '~shared/application/CQS/query.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { RentalEmergencyDetailsDto } from '../dto/rental.dto';

export interface GetRentalEmergencyDetailsPayload {
  rentalId: RentalId;
}

export abstract class IGetRentalEmergencyDetailsQuery
  extends Query<GetRentalEmergencyDetailsPayload, RentalEmergencyDetailsDto>
  implements IUseCase<GetRentalEmergencyDetailsPayload, RentalEmergencyDetailsDto> {}

@Injectable({ scope: Scope.REQUEST })
export class GetRentalEmergencyDetailsQuery extends IGetRentalEmergencyDetailsQuery {
  constructor(private readonly rentalMapper: RentalMapper) {
    super();
  }

  async implementation(): Promise<RentalEmergencyDetailsDto> {
    const { rentalId } = this._input;
    const rental = await this._dbContext.rentalsRepository.findById(rentalId);

    if (!rental) {
      throw new RentalNotFoundException(rentalId);
    }

    return this.rentalMapper.toEmergencyDetailsDto(rental);
  }
}
