import { Inject } from '@nestjs/common';

import { ClientDto } from '~modules/crm/domain/dto/client.dto';
import { Client } from '~modules/crm/domain/entities/client';
import { ClientMapper } from '~modules/crm/domain/mapper/client.mapper';
import { PhoneNumber } from '~modules/crm/domain/value-objects/phone-number.value';
import { Query } from '~shared/application/CQS/query.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

export interface FindClientByPhoneDto {
  phoneNumber: string;
}

export abstract class IFindClientByPhoneQuery
  extends Query<FindClientByPhoneDto, ClientDto | null>
  implements IUseCase<FindClientByPhoneDto, ClientDto | null> {}

export class FindClientByPhoneQuery extends IFindClientByPhoneQuery {
  constructor(private readonly clientMapper: ClientMapper) {
    super();
  }

  async implementation(): Promise<ClientDto | null> {
    const { phoneNumber } = this._input;

    const client = await this._dbContext.clientsRepository.findByPhoneNumber(phoneNumber);

    return client ? this.clientMapper.toDto(client) : null;
  }
}
