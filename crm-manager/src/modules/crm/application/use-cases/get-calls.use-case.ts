import { Injectable } from '@nestjs/common';

import { Call } from '~modules/crm/domain/entities/call';
import { CallMapper } from '~modules/crm/domain/mappers/call.mapper';
import { Query } from '~shared/application/CQS/query.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { CallDto } from '../dto/call.dto';

export abstract class IGetCallsQuery extends Query<void, CallDto[]> implements IUseCase<void, CallDto[]> {}

@Injectable()
export class GetCallsQuery extends IGetCallsQuery {
  constructor(private readonly callMapper: CallMapper) {
    super();
  }

  async implementation(): Promise<CallDto[]> {
    const calls = await this._dbContext.callsRepository.findAll();

    return calls.map((call) => this.callMapper.toDto(call));
  }
}
