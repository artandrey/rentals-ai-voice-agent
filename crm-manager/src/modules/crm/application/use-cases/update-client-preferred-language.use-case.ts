import { Inject } from '@nestjs/common';

import { ClientId, ClientPreferredLanguage } from '~modules/crm/domain/entities/client';
import { ClientMapper } from '~modules/crm/domain/mapper/client.mapper';
import { Command } from '~shared/application/CQS/command.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

export interface UpdateClientPreferredLanguageDto {
  clientId: ClientId;
  preferredLanguage: ClientPreferredLanguage;
}

export abstract class IUpdateClientPreferredLanguageUseCase
  extends Command<UpdateClientPreferredLanguageDto, void>
  implements IUseCase<UpdateClientPreferredLanguageDto, void> {}

export class UpdateClientPreferredLanguageUseCase extends IUpdateClientPreferredLanguageUseCase {
  constructor() {
    super();
  }

  async implementation(): Promise<void> {
    const { clientId, preferredLanguage } = this._input;

    const client = await this._dbContext.clientsRepository.findById(clientId);

    if (!client) {
      throw new Error('Client not found');
    }

    // Use the entity's method to set preferred language
    // This method handles validation of the language value
    client.setPreferredLanguage(preferredLanguage);

    await this._dbContext.clientsRepository.save(client);
  }
}
