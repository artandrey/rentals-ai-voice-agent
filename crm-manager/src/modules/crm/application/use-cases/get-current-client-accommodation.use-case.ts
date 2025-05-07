import { Injectable, NotFoundException } from '@nestjs/common';

import { Command } from '~shared/application/CQS/command.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { RentalMapper } from '../../domain/mappers/rental.mapper';
import { IAccommodationRepository } from '../../domain/repositories/accommodations-repository.interface';
import { IRentalsRepository } from '../../domain/repositories/rentals-repository.interface';
import { ClientAccommodationDto } from '../dto/accommodation.dto';
import { CompactRentalDto } from '../dto/rental.dto';

export interface GetCurrentClientAccommodationPayload {
  clientId: string;
}

export class CurrentClientAccommodationNotFoundException extends NotFoundException {
  constructor(clientId: string) {
    super(`Current accommodation for client ${clientId} not found`);
  }
}

export abstract class IGetCurrentClientAccommodationQuery
  extends Command<GetCurrentClientAccommodationPayload, ClientAccommodationDto>
  implements IUseCase<GetCurrentClientAccommodationPayload, ClientAccommodationDto> {}

@Injectable()
export class GetCurrentClientAccommodationQuery extends IGetCurrentClientAccommodationQuery {
  constructor(private readonly rentalMapper: RentalMapper) {
    super();
  }

  async implementation(): Promise<ClientAccommodationDto> {
    const { clientId } = this._input;
    const accommodation = await this._dbContext.accommodationsRepository.findMostRecentByClientId(clientId);
    if (!accommodation) {
      throw new CurrentClientAccommodationNotFoundException(clientId);
    }
    const rental = await this._dbContext.rentalsRepository.findById(accommodation.rentalId);
    if (!rental) {
      throw new NotFoundException(`Rental ${accommodation.rentalId} not found`);
    }
    const rentalDto: CompactRentalDto = this.rentalMapper.toCompactDto(rental);
    return {
      id: accommodation.id!,
      clientId: accommodation.clientId,
      rentalId: accommodation.rentalId,
      startDate: {
        year: accommodation.startDate['settlementTime'].getFullYear(),
        month: accommodation.startDate['settlementTime'].getMonth() + 1,
        day: accommodation.startDate['settlementTime'].getDate(),
      },
      endDate: {
        year: accommodation.endDate['settlementTime'].getFullYear(),
        month: accommodation.endDate['settlementTime'].getMonth() + 1,
        day: accommodation.endDate['settlementTime'].getDate(),
      },
      status: accommodation.status,
      rental: rentalDto,
    };
  }
}
