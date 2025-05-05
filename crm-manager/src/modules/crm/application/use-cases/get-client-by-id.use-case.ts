import { Inject } from '@nestjs/common';

import { ClientDto } from '~modules/crm/application/dto/client.dto';
import { ClientId } from '~modules/crm/domain/entities/client';
import { ClientMapper } from '~modules/crm/domain/mappers/client.mapper';
import { Query } from '~shared/application/CQS/query.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

export interface GetClientByIdDto {
  clientId: ClientId;
}

export abstract class IGetClientByIdQuery
  extends Query<GetClientByIdDto, ClientDto | null>
  implements IUseCase<GetClientByIdDto, ClientDto | null> {}

export class GetClientByIdQuery extends IGetClientByIdQuery {
  constructor(private readonly clientMapper: ClientMapper) {
    super();
  }

  async implementation(): Promise<ClientDto | null> {
    const { clientId } = this._input;

    const client = await this._dbContext.clientsRepository.findById(clientId);

    return client ? this.clientMapper.toDto(client) : null;
  }
}
