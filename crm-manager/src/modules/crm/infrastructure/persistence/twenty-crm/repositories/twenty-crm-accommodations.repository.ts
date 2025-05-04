import { Injectable } from '@nestjs/common';
import { AccommodationForResponse as AccommodationTwentyCrm, AccommodationsService } from 'twenty-crm-api-client';
import { client as ApiClient } from 'twenty-crm-api-client/client/client.gen';

import { Accommodation, AccommodationId } from '~modules/crm/domain/entities/accommodation';
import { RentalId } from '~modules/crm/domain/entities/rental';
import { IAccommodationRepository } from '~modules/crm/domain/repositories/accommodations-repository.interface';

import { TwentyCrmAccommodationsMapper } from '../mappers/twenty-crm-accommodations.mapper';

@Injectable()
export class TwentyCrmAccommodationsRepository extends IAccommodationRepository {
  private readonly accommodationsService = AccommodationsService;

  constructor(
    private readonly mapper: TwentyCrmAccommodationsMapper,
    private readonly apiClient: typeof ApiClient,
  ) {
    super();
  }

  async findById(id: AccommodationId): Promise<Accommodation | null> {
    try {
      const { data: response } = await this.accommodationsService.findOneAccommodation({
        path: {
          id,
        },
        client: this.apiClient,
      });
      if (!response?.data?.accommodation) {
        return null;
      }
      return this.mapper.toDomain(response.data.accommodation);
    } catch (error: any) {
      if (error?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async save(entity: Accommodation): Promise<AccommodationId> {
    const persistenceData = this.mapper.toPersistence(entity);
    if (entity.id) {
      const { data: response } = await this.accommodationsService.updateOneAccommodation({
        path: { id: entity.id },
        body: persistenceData,
        client: this.apiClient,
      });
      if (!response?.data?.updateAccommodation?.id) {
        throw new Error('Failed to update accommodation in TwentyCRM: No ID returned');
      }
      return response.data.updateAccommodation.id as AccommodationId;
    } else {
      const { data: response } = await this.accommodationsService.createOneAccommodation({
        body: persistenceData,
        client: this.apiClient,
      });
      if (!response?.data?.createAccommodation?.id) {
        throw new Error('Failed to create accommodation in TwentyCRM: No ID returned');
      }
      return response.data.createAccommodation.id as AccommodationId;
    }
  }

  async delete(id: AccommodationId): Promise<void> {
    try {
      await this.accommodationsService.deleteOneAccommodation({
        path: { id },
        client: this.apiClient,
      });
    } catch (error: any) {
      if (error?.status === 404) {
        return;
      }
      throw error;
    }
  }

  async findAll(): Promise<Accommodation[]> {
    const { data: response } = await this.accommodationsService.findManyAccommodations({
      client: this.apiClient,
    });
    const accommodationsData = response?.data?.accommodations ?? [];
    return accommodationsData.map((accommodationData) => this.mapper.toDomain(accommodationData));
  }

  async findByRentalId(rentalId: RentalId): Promise<Accommodation[]> {
    const { data: response } = await this.accommodationsService.findManyAccommodations({
      query: {
        filter: `rentalId[eq]:${rentalId}`,
      },
      client: this.apiClient,
    });
    const accommodationsData = response?.data?.accommodations ?? [];
    return accommodationsData.map((data) => this.mapper.toDomain(data));
  }
}
