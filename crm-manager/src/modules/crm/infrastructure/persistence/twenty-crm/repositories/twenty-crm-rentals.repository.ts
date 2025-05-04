import { Injectable } from '@nestjs/common';
import { RentalsService } from 'twenty-crm-api-client';
import { client as ApiClient } from 'twenty-crm-api-client/client/client.gen';

import { Rental, RentalId } from '~modules/crm/domain/entities/rental';
import { IRentalsRepository } from '~modules/crm/domain/repositories/rentals-repository.interface';

import { RentalsTwentyCrmMapper } from '../mappers/twenty-crm-rentals.mapper';

@Injectable()
export class TwentyCrmRentalsRepository extends IRentalsRepository {
  private readonly rentalsService = RentalsService;

  constructor(
    private readonly mapper: RentalsTwentyCrmMapper,
    private readonly apiClient: typeof ApiClient,
  ) {
    super();
  }

  async findById(id: RentalId): Promise<Rental | null> {
    try {
      const { data: response } = await this.rentalsService.findOneRental({
        path: {
          id,
        },
        client: this.apiClient,
      });
      if (!response?.data?.rental) {
        return null;
      }
      return this.mapper.toDomain(response.data.rental);
    } catch (error: any) {
      if (error?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async save(entity: Rental): Promise<RentalId> {
    if (!entity.id) {
      return this.createRental(entity);
    }
    try {
      const { data: response } = await this.rentalsService.findOneRental({
        path: {
          id: entity.id,
        },
        client: this.apiClient,
      });
      if (response?.data?.rental) {
        return this.updateRental(entity);
      }
    } catch (error: any) {
      if (error?.status !== 404) {
        throw error;
      }
      // else: not found, so create
    }
    return this.createRental(entity);
  }

  private async createRental(entity: Rental): Promise<RentalId> {
    const { data: response } = await this.rentalsService.createOneRental({
      body: this.mapper.toPersistence(entity),
      client: this.apiClient,
    });
    if (!response?.data?.createRental?.id) {
      throw new Error('Failed to create rental in TwentyCRM: No ID returned');
    }
    return response.data.createRental.id as RentalId;
  }

  private async updateRental(entity: Rental): Promise<RentalId> {
    const { data: response } = await this.rentalsService.updateOneRental({
      path: { id: entity.id },
      body: this.mapper.toPersistence(entity),
      client: this.apiClient,
    });
    if (!response?.data?.updateRental?.id) {
      throw new Error('Failed to update rental in TwentyCRM: No ID returned');
    }
    return response.data.updateRental.id as RentalId;
  }

  async delete(id: RentalId): Promise<void> {
    try {
      await this.rentalsService.deleteOneRental({
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

  async findAll(): Promise<Rental[]> {
    const { data: response } = await this.rentalsService.findManyRentals({
      client: this.apiClient,
    });
    return response?.data?.rentals?.map((rental) => this.mapper.toDomain(rental)) ?? [];
  }
}
