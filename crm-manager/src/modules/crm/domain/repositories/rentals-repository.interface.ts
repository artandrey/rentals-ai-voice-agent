import { IBaseRepository } from '~shared/domain/repositories/base-repository.interface';

import { Rental, RentalId } from '../entities/rental';

export abstract class IRentalsRepository implements IBaseRepository<Rental, RentalId> {
  abstract findById(id: RentalId): Promise<Rental | null>;
  abstract save(entity: Rental): Promise<RentalId>;
  abstract delete(id: RentalId): Promise<void>;
  abstract findAll(): Promise<Rental[]>;
}
