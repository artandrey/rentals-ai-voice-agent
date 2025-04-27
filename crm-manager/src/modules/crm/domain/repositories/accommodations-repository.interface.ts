import { Accommodation } from '../entities/accommodation';

export abstract class IAccommodationsRepository {
  abstract findById(id: string): Promise<Accommodation>;
  abstract save(accommodation: Accommodation): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract findByRentalId(rentalId: string): Promise<Accommodation[]>;
}
