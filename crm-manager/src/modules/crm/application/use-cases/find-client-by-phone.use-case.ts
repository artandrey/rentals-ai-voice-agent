import { Injectable, Scope } from '@nestjs/common';

import { ClientDto } from '~modules/crm/application/dto/client.dto';
import { ClientNotFoundException } from '~modules/crm/domain/exception/client-not-found.exception';
import { ClientMapper } from '~modules/crm/domain/mappers/client.mapper';
import { PhoneNumber } from '~modules/crm/domain/value-objects/phone-number.value';
import { Query } from '~shared/application/CQS/query.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

export interface FindClientByPhoneDto {
  phoneNumber: string;
}

export abstract class IFindClientByPhoneQuery
  extends Query<FindClientByPhoneDto, ClientDto>
  implements IUseCase<FindClientByPhoneDto, ClientDto> {}

@Injectable({ scope: Scope.REQUEST })
export class FindClientByPhoneQuery extends IFindClientByPhoneQuery {
  constructor(private readonly clientMapper: ClientMapper) {
    super();
  }

  async implementation(): Promise<ClientDto> {
    const { phoneNumber } = this._input;
    const phoneNumberObj = PhoneNumber.create(phoneNumber);

    const client = await this._dbContext.clientsRepository.findByPhoneNumber(phoneNumberObj);

    if (!client) {
      throw new ClientNotFoundException(`with phone number ${phoneNumber}` as any);
    }

    return this.clientMapper.toDto(client);
  }
}
