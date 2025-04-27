import { Inject } from '@nestjs/common';

import { ClientId } from '~modules/crm/domain/entities/client';
import { ClientMapper } from '~modules/crm/domain/mapper/client.mapper';
import { Command } from '~shared/application/CQS/command.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

export interface UpdateClientPreferencesDto {
  clientId: ClientId;
  preferences: string[];
}

export abstract class IUpdateClientPreferencesUseCase
  extends Command<UpdateClientPreferencesDto, void>
  implements IUseCase<UpdateClientPreferencesDto, void> {}

export class UpdateClientPreferencesUseCase extends IUpdateClientPreferencesUseCase {
  constructor() {
    super();
  }

  async implementation(): Promise<void> {
    const { clientId, preferences } = this._input;

    const client = await this._dbContext.clientsRepository.findById(clientId);

    if (!client) {
      throw new Error('Client not found');
    }

    // Override the previous preferences with the new array using the setter
    client.setPreferences(preferences);

    await this._dbContext.clientsRepository.save(client);
  }
}
