import { Inject } from '@nestjs/common';

import { ClientDto } from '~modules/crm/application/dto/client.dto';
import { Client } from '~modules/crm/domain/entities/client';
import { ClientMapper } from '~modules/crm/domain/mapper/client.mapper';
import { Query } from '~shared/application/CQS/query.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

export abstract class IGetClientsQuery extends Query<void, ClientDto[]> implements IUseCase<void, ClientDto[]> {}

export class GetClientsQuery extends IGetClientsQuery {
  constructor(private readonly clientMapper: ClientMapper) {
    super();
  }

  async implementation(): Promise<ClientDto[]> {
    // Get all clients from database - need to implement custom query as findAll is not in the repository
    const allClients: Client[] = [];

    return allClients.map((client) => this.clientMapper.toDto(client));
  }
}
