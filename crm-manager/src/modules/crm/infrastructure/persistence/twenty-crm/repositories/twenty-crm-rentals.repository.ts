import { Injectable } from '@nestjs/common';
import { RentalsService } from 'twenty-crm-api-client';

import { Rental, RentalId } from '~modules/crm/domain/entities/rental';
import { IRentalsRepository } from '~modules/crm/domain/repositories/rentals-repository.interface';

import { RentalsTwentyCrmMapper } from '../mappers/twenty-crm-rentals.mapper';

@Injectable()
export class TwentyCrmRentalsRepository extends IRentalsRepository {
  private readonly rentalsService = RentalsService;

  constructor(private readonly mapper: RentalsTwentyCrmMapper) {
    super();
  }

  async findById(id: RentalId): Promise<Rental | null> {
    const { data: response } = await this.rentalsService.findOneRental({
      path: {
        id,
      },
    });

    if (!response.data?.rental) {
      return null;
    }

    return this.mapper.toDomain(response.data.rental);
  }

  async save(entity: Rental): Promise<RentalId> {
    const { data: response } = await this.rentalsService.findOneRental({
      path: {
        id: entity.id,
      },
    });

    if (response.data?.rental) {
      return this.updateRental(entity);
    }

    return this.createRental(entity);
  }

  private async createRental(entity: Rental): Promise<RentalId> {
    const { data: response } = await this.rentalsService.createOneRental({
      body: this.mapper.toPersistence(entity),
    });

    return response.data?.createRental?.id as RentalId;
  }

  private async updateRental(entity: Rental): Promise<RentalId> {
    const { data: response } = await this.rentalsService.updateOneRental({
      path: { id: entity.id },
      body: this.mapper.toPersistence(entity),
    });

    return response.data?.updateRental?.id as RentalId;
  }

  async delete(id: RentalId): Promise<void> {
    await this.rentalsService.deleteOneRental({
      path: { id },
    });
  }

  async findAll(): Promise<Rental[]> {
    const { data: response } = await this.rentalsService.findManyRentals();

    return response.data?.rentals?.map((rental) => this.mapper.toDomain(rental)) ?? [];
  }
}
