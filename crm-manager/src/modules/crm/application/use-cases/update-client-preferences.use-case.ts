import { Inject } from '@nestjs/common';

import { ClientId } from '~modules/crm/domain/entities/client';
import { ClientMapper } from '~modules/crm/domain/mapper/client.mapper';
import { Command } from '~shared/application/CQS/command.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { UpdateClientPreferencesDto } from '../dto/client.dto';

export interface UpdateClientPreferencesPayload {
  clientId: ClientId;
  updates: UpdateClientPreferencesDto;
}

export abstract class IUpdateClientPreferencesUseCase
  extends Command<UpdateClientPreferencesPayload, void>
  implements IUseCase<UpdateClientPreferencesPayload, void> {}

export class UpdateClientPreferencesUseCase extends IUpdateClientPreferencesUseCase {
  constructor() {
    super();
  }

  async implementation(): Promise<void> {
    const { clientId, updates } = this._input;
    const { preferences } = updates;

    const client = await this._dbContext.clientsRepository.findById(clientId);

    if (!client) {
      throw new Error('Client not found');
    }

    client.setPreferences(preferences);

    await this._dbContext.clientsRepository.save(client);
  }
}
