import { client } from 'twenty-crm-api-client/client/client.gen';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { RentalsTwentyCrmMapper } from '../../infrastructure/persistence/twenty-crm/mappers/twenty-crm-rentals.mapper';
import { TwentyCrmRentalsRepository } from '../../infrastructure/persistence/twenty-crm/repositories/twenty-crm-rentals.repository';
import { Rental, RentalId } from '../entities/rental';
import { Location } from '../value-objects/location.value';
import { Price } from '../value-objects/price.value';
import { sampleLocation, samplePrice } from './__fixtures__/value-objects';

describe('TwentyCrmRentalsRepository (integration)', () => {
  const mapper = new RentalsTwentyCrmMapper();
  const repository = new TwentyCrmRentalsRepository(mapper, client);

  let cleanupRentalId: RentalId | undefined;

  beforeAll(() => {
    client.setConfig({
      baseURL: 'http://localhost:3000/rest',
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZTA1OGFiMC01OTliLTRkZTktYmNkZS01YmJjMGMxNDNjY2EiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiOWUwNThhYjAtNTk5Yi00ZGU5LWJjZGUtNWJiYzBjMTQzY2NhIiwiaWF0IjoxNzQ0NDEzMTA2LCJleHAiOjQ4OTgwMTY3MDUsImp0aSI6ImUwYWI2ZmFjLTczNWYtNDg5NS1iNzFkLTEzNTExNzM1MWRhZSJ9.zdPLPrjd_EguVz32NcyHiKfdDNb7FtD67L4HoOiHevM`,
      },
    });
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
    expect(found?.location).toBeDefined();
    expect(found?.pricePerDay).toBeDefined();
    expect(found?.pricePerDay.amountMicros).toBe(samplePrice().amountMicros);
  });

  it('should return all rentals (findAll)', async () => {
    const all = await repository.findAll();
    expect(Array.isArray(all)).toBe(true);
  });

  it('should delete a rental', async () => {
    const rentalEntity = Rental.builder(sampleLocation(), samplePrice()).build();
    const id = await repository.save(rentalEntity);

    await repository.delete(id);
    const found = await repository.findById(id);
    expect(found).toBeNull();
  });
});
