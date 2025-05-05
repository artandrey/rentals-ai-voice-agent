import { Inject } from '@nestjs/common';

import { ClientId, ClientPreferredLanguage } from '~modules/crm/domain/entities/client';
import { ClientMapper } from '~modules/crm/domain/mappers/client.mapper';
import { Command } from '~shared/application/CQS/command.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { UpdateClientPreferredLanguageDto } from '../dto/client.dto';

export interface UpdateClientPreferredLanguagePayload {
  clientId: ClientId;
  updates: UpdateClientPreferredLanguageDto;
}

export abstract class IUpdateClientPreferredLanguageUseCase
  extends Command<UpdateClientPreferredLanguagePayload, void>
  implements IUseCase<UpdateClientPreferredLanguagePayload, void> {}

export class UpdateClientPreferredLanguageUseCase extends IUpdateClientPreferredLanguageUseCase {
  constructor() {
    super();
  }

  async implementation(): Promise<void> {
    const { clientId, updates } = this._input;
    const { language } = updates;

    const client = await this._dbContext.clientsRepository.findById(clientId);

    if (!client) {
      throw new Error('Client not found');
    }

    client.setPreferredLanguage(language);

    await this._dbContext.clientsRepository.save(client);
  }
}
