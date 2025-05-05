import { Inject } from '@nestjs/common';

import { ClientDto, CreateClientDto } from '~modules/crm/application/dto/client.dto';
import { ClientId } from '~modules/crm/domain/entities/client';
import { Client } from '~modules/crm/domain/entities/client';
import { ClientMapper } from '~modules/crm/domain/mappers/client.mapper';
import { PhoneNumber } from '~modules/crm/domain/value-objects/phone-number.value';
import { Command } from '~shared/application/CQS/command.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

export abstract class ICreateClientUseCase
  extends Command<CreateClientDto, ClientDto>
  implements IUseCase<CreateClientDto, ClientDto> {}

export class CreateClientUseCase extends ICreateClientUseCase {
  constructor(private readonly clientMapper: ClientMapper) {
    super();
  }

  async implementation(): Promise<ClientDto> {
    const { firstName, lastName, phoneNumber, middleName } = this._input;

    const client = new Client(firstName, lastName, PhoneNumber.create(phoneNumber));

    if (middleName) {
      client.setMiddleName(middleName);
    }

    const clientId = await this._dbContext.clientsRepository.save(client);

    const savedClient = await this._dbContext.clientsRepository.findById(clientId);

    if (!savedClient) {
      throw new Error('Failed to retrieve saved client');
    }

    return this.clientMapper.toDto(savedClient);
  }
}
