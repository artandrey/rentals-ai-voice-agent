import { Rental } from '~modules/crm/domain/entities/rental';
import { Query } from '~shared/application/CQS/query.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

export abstract class IGetRentalsQuery extends Query<void, Rental[]> implements IUseCase<void, Rental[]> {}

export class GetRentalsQuery extends IGetRentalsQuery {
  constructor() {
    super();
  }

  async implementation(): Promise<Rental[]> {
    return this._dbContext.rentalsRepository.findAll();
  }
}
