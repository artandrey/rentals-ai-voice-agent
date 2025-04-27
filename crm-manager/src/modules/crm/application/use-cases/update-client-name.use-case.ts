import { Inject } from '@nestjs/common';

import { ClientId } from '~modules/crm/domain/entities/client';
import { ClientMapper } from '~modules/crm/domain/mapper/client.mapper';
import { Command } from '~shared/application/CQS/command.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

export interface UpdateClientNameDto {
  clientId: ClientId;
  firstName: string;
  lastName: string;
  middleName?: string;
}

export abstract class IUpdateClientNameUseCase
  extends Command<UpdateClientNameDto, void>
  implements IUseCase<UpdateClientNameDto, void> {}

export class UpdateClientNameUseCase extends IUpdateClientNameUseCase {
  constructor() {
    super();
  }

  async implementation(): Promise<void> {
    const { clientId, firstName, lastName, middleName } = this._input;

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
