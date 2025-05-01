import { Injectable, NotFoundException } from '@nestjs/common';
import { Accommodation_for_Response as AccommodationTwentyCrm, AccommodationsService } from 'twenty-crm-api-client';

import { Accommodation, AccommodationId } from '~modules/crm/domain/entities/accommodation';
import { RentalId } from '~modules/crm/domain/entities/rental';
import { IAccommodationRepository } from '~modules/crm/domain/repositories/accommodations-repository.interface';

import { TwentyCrmAccommodationsMapper } from '../mappers/twenty-crm-accommodations.mapper';

@Injectable()
export class TwentyCrmAccommodationsRepository extends IAccommodationRepository {
  // Assuming AccommodationsService is static or needs instantiation if not
  private readonly accommodationsService = AccommodationsService;

  constructor(private readonly mapper: TwentyCrmAccommodationsMapper) {
    super();
  }

  async findById(id: AccommodationId): Promise<Accommodation | null> {
    try {
      const { data: response } = await this.accommodationsService.findOneAccommodation({
        path: {
          id: id as string, // Cast ID to string for API call
        },
        // query: { depth: 1 } // Add depth if needed for relations
      });

      if (!response?.data?.accommodation) {
        return null;
      }

      // Warning: Mapper currently uses dummy Client/Rental. Fetching real ones might be needed.
      return this.mapper.toDomain(response.data.accommodation);
    } catch (error: any) {
      // Handle case where findOne throws 404
      if (error?.status === 404) {
        return null;
      }
      console.error('Error finding accommodation by ID from TwentyCRM:', error);
      throw error; // Re-throw other errors
    }
  }

  async save(entity: Accommodation): Promise<AccommodationId> {
    const persistenceData = this.mapper.toPersistence(entity);

    try {
      if (entity.id) {
        // Update existing accommodation
        const { data: response } = await this.accommodationsService.updateOneAccommodation({
          path: { id: entity.id as string },
          body: persistenceData, // Type should match Accommodation_for_Update
        });

        if (!response?.data?.updateAccommodation?.id) {
          throw new Error('Failed to update accommodation in TwentyCRM: No ID returned');
        }
        return response.data.updateAccommodation.id as AccommodationId;
      } else {
        // Create new accommodation
        const { data: response } = await this.accommodationsService.createOneAccommodation({
          body: persistenceData, // Type should match Accommodation
        });

        if (!response?.data?.createAccommodation?.id) {
          throw new Error('Failed to create accommodation in TwentyCRM: No ID returned');
        }
        return response.data.createAccommodation.id as AccommodationId;
      }
    } catch (error) {
      console.error('Error saving accommodation to TwentyCRM:', error);
      // Consider more specific error handling based on potential API errors
      throw error;
    }
  }

  async delete(id: AccommodationId): Promise<void> {
    try {
      await this.accommodationsService.deleteOneAccommodation({
        path: { id: id as string },
      });
    } catch (error: any) {
      // Ignore 404 errors on delete (idempotency)
      if (error?.status === 404) {
        return;
      }
      console.error('Error deleting accommodation from TwentyCRM:', error);
      throw error; // Re-throw other errors
    }
  }

  async findAll(): Promise<Accommodation[]> {
    try {
      const { data: response } = await this.accommodationsService.findManyAccommodations({
        // Add query parameters like pagination (limit, starting_after) or filters if needed
        // query: { depth: 1 } // Add depth if needed for relations
      });

      const accommodationsData = response?.data?.accommodations ?? [];

      // Warning: Mapper currently uses dummy Client/Rental. Fetching real ones might be needed.
      return accommodationsData.map((accommodationData) => this.mapper.toDomain(accommodationData));
    } catch (error) {
      console.error('Error finding all accommodations from TwentyCRM:', error);
      throw error;
    }
  }

  async findByRentalId(rentalId: RentalId): Promise<Accommodation[]> {
    const { data: response } = await this.accommodationsService.findManyAccommodations({
      query: {
        filter: `rentalId[eq]:${rentalId}`,
      },
    });

    const accommodationsData = response?.data?.accommodations ?? [];

    return accommodationsData.map((data) => this.mapper.toDomain(data));
  }
}
