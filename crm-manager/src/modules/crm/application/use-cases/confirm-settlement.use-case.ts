import { Injectable, Scope } from '@nestjs/common';

import { AccommodationId } from '~modules/crm/domain/entities/accommodation';
import { Command } from '~shared/application/CQS/command.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { SettlementConfirmationDto } from '../dto/accommodation.dto';

export interface ConfirmSettlementPayload {
  accommodationId: AccommodationId;
}

export abstract class IConfirmSettlementUseCase
  extends Command<SettlementConfirmationDto, void>
  implements IUseCase<SettlementConfirmationDto, void> {}

@Injectable({ scope: Scope.REQUEST })
export class ConfirmSettlementUseCase extends IConfirmSettlementUseCase {
  constructor() {
    super();
  }

  async implementation(): Promise<void> {
    const { accommodationId } = this._input;

    const accommodation = await this._dbContext.accommodationsRepository.findById(accommodationId as AccommodationId);

    if (!accommodation) {
      throw new Error('Accommodation not found');
    }

    accommodation.settle();

    await this._dbContext.accommodationsRepository.save(accommodation);
  }
}
