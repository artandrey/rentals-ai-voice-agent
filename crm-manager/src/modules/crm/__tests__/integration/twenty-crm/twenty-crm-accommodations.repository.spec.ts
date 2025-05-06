import { client } from 'twenty-crm-api-client/client/client.gen';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Accommodation, AccommodationId } from '../../../domain/entities/accommodation';
import { Client, ClientId, ClientPreferredLanguage } from '../../../domain/entities/client';
import { Rental, RentalId } from '../../../domain/entities/rental';
import { DayDate } from '../../../domain/value-objects/day-date.value';
import { Location } from '../../../domain/value-objects/location.value';
import { PhoneNumber } from '../../../domain/value-objects/phone-number.value';
import { Price } from '../../../domain/value-objects/price.value';
import { TwentyCrmAccommodationsMapper } from '../../../infrastructure/persistence/twenty-crm/mappers/twenty-crm-accommodations.mapper';
import { TwentyCrmClientsMapper } from '../../../infrastructure/persistence/twenty-crm/mappers/twenty-crm-clients.mapper';
import { TwentyCrmRentalsMapper } from '../../../infrastructure/persistence/twenty-crm/mappers/twenty-crm-rentals.mapper';
import { TwentyCrmAccommodationsRepository } from '../../../infrastructure/persistence/twenty-crm/repositories/twenty-crm-accommodations.repository';
import { TwentyCrmClientsRepository } from '../../../infrastructure/persistence/twenty-crm/repositories/twenty-crm-clients.repository';
import { TwentyCrmRentalsRepository } from '../../../infrastructure/persistence/twenty-crm/repositories/twenty-crm-rentals.repository';
import { getTwentyCrmClientConfig } from '../../__fixtures__/twenty-crm-client-config';
import { sampleLocation, samplePrice, validTestPhoneNumber } from '../../__fixtures__/value-objects';

describe('TwentyCrmAccommodationsRepository (integration)', () => {
  const clientMapper = new TwentyCrmClientsMapper();
  const clientRepo = new TwentyCrmClientsRepository(clientMapper, client);

  const rentalMapper = new TwentyCrmRentalsMapper();
  const rentalRepo = new TwentyCrmRentalsRepository(rentalMapper, client);

  const mapper = new TwentyCrmAccommodationsMapper();
  const repository = new TwentyCrmAccommodationsRepository(mapper, client);

  let cleanupClientId: ClientId | undefined;
  let cleanupRentalId: RentalId | undefined;
  let cleanupAccommodationId: AccommodationId | undefined;

  beforeAll(() => {
    client.setConfig(getTwentyCrmClientConfig());
  });

  afterEach(async () => {
    if (cleanupAccommodationId) {
      await repository.delete(cleanupAccommodationId);
      cleanupAccommodationId = undefined;
    }
    if (cleanupRentalId) {
      await rentalRepo.delete(cleanupRentalId);
      cleanupRentalId = undefined;
    }
    if (cleanupClientId) {
      await clientRepo.delete(cleanupClientId);
      cleanupClientId = undefined;
    }
  });

  it('should create an accommodation (save)', async () => {
    const testPhone = validTestPhoneNumber();
    const clientEntity = Client.builder('Test', 'User', PhoneNumber.create(testPhone))
      .preferredLanguage(ClientPreferredLanguage.ENGLISH)
      .note('Integration test accommodation client')
      .build();
    const clientId = await clientRepo.save(clientEntity);
    cleanupClientId = clientId;

    const address = new Location('Test Street', 'Test City', '123');
    const price = new Price(100, 'USD');
    const rentalEntity = Rental.builder(address, price).build();
    const rentalId = await rentalRepo.save(rentalEntity);
    cleanupRentalId = rentalId;

    const startDate = new DayDate(2025, 2, 20);
    const endDate = new DayDate(2025, 2, 21);
    const accommodationEntity = Accommodation.builder(clientId, rentalId, startDate, endDate).build();
    const id = await repository.save(accommodationEntity);
    expect(id).toBeDefined();
    cleanupAccommodationId = id;
  });

  it('should find an accommodation by id', async () => {
    const testPhone = validTestPhoneNumber();
    const clientEntity = Client.builder('Test', 'User', PhoneNumber.create(testPhone))
      .preferredLanguage(ClientPreferredLanguage.ENGLISH)
      .note('Integration test accommodation client')
      .build();
    const clientId = await clientRepo.save(clientEntity);
    cleanupClientId = clientId;

    const address = new Location('Test Street', 'Test City', '123');
    const price = new Price(100, 'USD');
    const rentalEntity = Rental.builder(address, price).build();
    const rentalId = await rentalRepo.save(rentalEntity);
    cleanupRentalId = rentalId;

    const startDate = new DayDate(2025, 2, 20);
    const endDate = new DayDate(2025, 2, 21);
    const accommodationEntity = Accommodation.builder(clientId, rentalId, startDate, endDate).build();
    const id = await repository.save(accommodationEntity);
    cleanupAccommodationId = id;

    const found = await repository.findById(id);
    expect(found).not.toBeNull();
    expect(found?.clientId).toBe(clientId);
    expect(found?.rentalId).toBe(rentalId);
    expect(found?.startDate).toBeDefined();
    expect(found?.endDate).toBeDefined();
  });

  it('should find accommodations by rental id', async () => {
    const testPhone = validTestPhoneNumber();
    const clientEntity = Client.builder('Test', 'User', PhoneNumber.create(testPhone))
      .preferredLanguage(ClientPreferredLanguage.ENGLISH)
      .note('Integration test accommodation client')
      .build();
    const clientId = await clientRepo.save(clientEntity);
    cleanupClientId = clientId;

    const address = new Location('Test Street', 'Test City', '123');
    const price = new Price(100, 'USD');
    const rentalEntity = Rental.builder(address, price).build();
    const rentalId = await rentalRepo.save(rentalEntity);
    cleanupRentalId = rentalId;

    const startDate = new DayDate(2025, 2, 20);
    const endDate = new DayDate(2025, 2, 21);
    const accommodationEntity = Accommodation.builder(clientId, rentalId, startDate, endDate).build();
    const id = await repository.save(accommodationEntity);
    cleanupAccommodationId = id;

    const foundList = await repository.findByRentalId(rentalId);
    expect(Array.isArray(foundList)).toBe(true);
    expect(foundList.length).toBeGreaterThan(0);
    expect(foundList[0].id).toBe(id);
  });

  it('should return all accommodations (findAll)', async () => {
    const all = await repository.findAll();
    expect(Array.isArray(all)).toBe(true);
  });

  it('should delete an accommodation', async () => {
    const testPhone = validTestPhoneNumber();
    const clientEntity = Client.builder('Test', 'User', PhoneNumber.create(testPhone))
      .preferredLanguage(ClientPreferredLanguage.ENGLISH)
      .note('Integration test accommodation client')
      .build();
    const clientId = await clientRepo.save(clientEntity);
    cleanupClientId = clientId;

    const address = new Location('Test Street', 'Test City', '123');
    const price = new Price(100, 'USD');
    const rentalEntity = Rental.builder(address, price).build();
    const rentalId = await rentalRepo.save(rentalEntity);
    cleanupRentalId = rentalId;

    const startDate = new DayDate(2025, 2, 20);
    const endDate = new DayDate(2025, 2, 21);
    const accommodationEntity = Accommodation.builder(clientId, rentalId, startDate, endDate).build();
    const id = await repository.save(accommodationEntity);

    await repository.delete(id);
    const found = await repository.findById(id);
    expect(found).toBeNull();
  });

  it('should handle 404 errors when finding an accommodation by ID', async () => {
    const nonExistentId = 'non-existent-id' as AccommodationId;
    const found = await repository.findById(nonExistentId);
    expect(found).toBeNull();
  });

  it('should handle 404 errors when deleting a non-existent accommodation', async () => {
    const nonExistentId = 'non-existent-id' as AccommodationId;
    // This should not throw an error
    await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
  });

  it('should throw errors for failed create operations', async () => {
    // Create an accommodation with invalid data
    const invalidAccommodation = {} as any;
    await expect(repository.save(invalidAccommodation)).rejects.toThrow();
  });

  it('should throw a specific error for failures during update operations', async () => {
    // Create a valid accommodation first
    const testPhone = validTestPhoneNumber();
    const clientEntity = Client.builder('Test', 'User', PhoneNumber.create(testPhone))
      .preferredLanguage(ClientPreferredLanguage.ENGLISH)
      .note('Integration test accommodation client')
      .build();
    const clientId = await clientRepo.save(clientEntity);
    cleanupClientId = clientId;

    const address = new Location('Test Street', 'Test City', '123');
    const price = new Price(100, 'USD');
    const rentalEntity = Rental.builder(address, price).build();
    const rentalId = await rentalRepo.save(rentalEntity);
    cleanupRentalId = rentalId;

    const startDate = new DayDate(2025, 2, 20);
    const endDate = new DayDate(2025, 2, 21);
    const accommodationEntity = Accommodation.builder(clientId, rentalId, startDate, endDate).build();

    // Mock the API client to throw an error during update
    const originalUpdateMethod = repository['accommodationsService'].updateOneAccommodation;
    repository['accommodationsService'].updateOneAccommodation = vi.fn().mockRejectedValue(new Error('Update failed'));

    // Create an accommodation with an invalid ID for update
    const invalidEntity = Accommodation.builder(clientId, rentalId, startDate, endDate).build();
    (invalidEntity as any).id = 'invalid-id';

    // Expect the save operation to throw an error
    await expect(repository.save(invalidEntity)).rejects.toThrow('Update failed');

    // Restore the original method
    repository['accommodationsService'].updateOneAccommodation = originalUpdateMethod;
  });
});
