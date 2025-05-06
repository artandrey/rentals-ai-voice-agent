import { Inject, Injectable, Scope } from '@nestjs/common';

import { ClientDto } from '~modules/crm/application/dto/client.dto';
import { ClientId } from '~modules/crm/domain/entities/client';
import { ClientNotFoundException } from '~modules/crm/domain/exception/client-not-found.exception';
import { ClientMapper } from '~modules/crm/domain/mappers/client.mapper';
import { Query } from '~shared/application/CQS/query.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

export interface GetClientByIdDto {
  clientId: ClientId;
}

export abstract class IGetClientByIdQuery
  extends Query<GetClientByIdDto, ClientDto>
  implements IUseCase<GetClientByIdDto, ClientDto> {}

@Injectable({ scope: Scope.REQUEST })
export class GetClientByIdQuery extends IGetClientByIdQuery {
  constructor(private readonly clientMapper: ClientMapper) {
    super();
  }

  async implementation(): Promise<ClientDto> {
    const { clientId } = this._input;

    const client = await this._dbContext.clientsRepository.findById(clientId);

    if (!client) {
      throw new ClientNotFoundException(clientId);
    }

    return this.clientMapper.toDto(client);
  }
}
