import { client } from 'twenty-crm-api-client/client/client.gen';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Rental, RentalId } from '../../../domain/entities/rental';
import { Location } from '../../../domain/value-objects/location.value';
import { Price } from '../../../domain/value-objects/price.value';
import { TwentyCrmRentalsMapper } from '../../../infrastructure/persistence/twenty-crm/mappers/twenty-crm-rentals.mapper';
import { TwentyCrmRentalsRepository } from '../../../infrastructure/persistence/twenty-crm/repositories/twenty-crm-rentals.repository';
import { getTwentyCrmClientConfig } from '../../__fixtures__/twenty-crm-client-config';
import { sampleLocation, samplePrice } from '../../__fixtures__/value-objects';

describe('TwentyCrmRentalsRepository (integration)', () => {
  const mapper = new TwentyCrmRentalsMapper();
  const repository = new TwentyCrmRentalsRepository(mapper, client);

  let cleanupRentalId: RentalId | undefined;

  beforeAll(() => {
    client.setConfig(getTwentyCrmClientConfig());
  });

  afterEach(async () => {
    if (cleanupRentalId) {
      await repository.delete(cleanupRentalId);
      cleanupRentalId = undefined;
    }
  });

  it('should create a rental (save)', async () => {
    const rentalEntity = Rental.builder(sampleLocation(), samplePrice()).build();
    const id = await repository.save(rentalEntity);
    expect(id).toBeDefined();
    cleanupRentalId = id;
  });

  it('should find a rental by id', async () => {
    const rentalEntity = Rental.builder(sampleLocation(), samplePrice()).build();
    const id = await repository.save(rentalEntity);
    cleanupRentalId = id;

    const found = await repository.findById(id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(id);
    expect(found?.location).toBeDefined();
    expect(found?.pricePerDay).toBeDefined();
    expect(found?.pricePerDay.amountMicros).toBe(samplePrice().amountMicros);
  });

  it('should return all rentals (findAll)', async () => {
    const all = await repository.findAll();
    expect(Array.isArray(all)).toBe(true);

    // Verify that each rental has an ID
    if (all.length > 0) {
      all.forEach((rental) => {
        expect(rental.id).toBeDefined();
      });
    }
  });

  it('should delete a rental', async () => {
    const rentalEntity = Rental.builder(sampleLocation(), samplePrice()).build();
    const id = await repository.save(rentalEntity);

    await repository.delete(id);
    const found = await repository.findById(id);
    expect(found).toBeNull();
  });

  it('should handle 404 errors when finding a rental by ID', async () => {
    const nonExistentId = 'non-existent-id' as RentalId;
    const found = await repository.findById(nonExistentId);
    expect(found).toBeNull();
  });

  it('should handle 404 errors when deleting a non-existent rental', async () => {
    const nonExistentId = 'non-existent-id' as RentalId;
    // This should not throw an error
    await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
  });

  it('should throw errors for failed create operations', async () => {
    // Create a rental with invalid data
    const invalidRental = {} as any;
    await expect(repository.save(invalidRental)).rejects.toThrow();
  });
});
