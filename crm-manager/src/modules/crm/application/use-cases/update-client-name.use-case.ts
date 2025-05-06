import { Inject, Injectable, Scope } from '@nestjs/common';

import { ClientId } from '~modules/crm/domain/entities/client';
import { ClientMapper } from '~modules/crm/domain/mappers/client.mapper';
import { Command } from '~shared/application/CQS/command.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { UpdateClientNameDto } from '../dto/client.dto';

export interface UpdateClientNamePayload {
  clientId: ClientId;
  updates: UpdateClientNameDto;
}

export abstract class IUpdateClientNameUseCase
  extends Command<UpdateClientNamePayload, void>
  implements IUseCase<UpdateClientNamePayload, void> {}

@Injectable({ scope: Scope.REQUEST })
export class UpdateClientNameUseCase extends IUpdateClientNameUseCase {
  constructor() {
    super();
  }

  async implementation(): Promise<void> {
    const { clientId, updates } = this._input;
    const { firstName, lastName, middleName } = updates;

    const client = await this._dbContext.clientsRepository.findById(clientId);

    if (!client) {
      throw new Error('Client not found');
    }

    client.setFirstName(firstName);
    client.setLastName(lastName);
    client.setMiddleName(middleName || null);

    await this._dbContext.clientsRepository.save(client);
  }
}
