import { Accommodation, AccommodationId } from '../entities/accommodation';
import { RentalId } from '../entities/rental';

export abstract class IAccommodationRepository {
  abstract findById(id: AccommodationId): Promise<Accommodation | null>;
  abstract save(entity: Accommodation): Promise<AccommodationId>;
  abstract delete(id: AccommodationId): Promise<void>;
  abstract findAll(): Promise<Accommodation[]>;
  abstract findByRentalId(rentalId: RentalId): Promise<Accommodation[]>;
  abstract findMostRecentByClientId(clientId: string): Promise<Accommodation | null>;
}
