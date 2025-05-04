import { client } from 'twenty-crm-api-client/client/client.gen';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Accommodation, AccommodationId } from '../../../domain/entities/accommodation';
import { Client, ClientId, ClientPreferredLanguage } from '../../../domain/entities/client';
import { Rental, RentalId } from '../../../domain/entities/rental';
import { DayDate } from '../../../domain/value-objects/day-date.value';
import { Location } from '../../../domain/value-objects/location.value';
import { PhoneNumber } from '../../../domain/value-objects/phone-number.value';
import { Price } from '../../../domain/value-objects/price.value';
import { TwentyCrmAccommodationsMapper } from '../../../infrastructure/persistence/twenty-crm/mappers/twenty-crm-accommodations.mapper';
import { ClientsTwentyCrmMapper } from '../../../infrastructure/persistence/twenty-crm/mappers/twenty-crm-clients.mapper';
import { RentalsTwentyCrmMapper } from '../../../infrastructure/persistence/twenty-crm/mappers/twenty-crm-rentals.mapper';
import { TwentyCrmAccommodationsRepository } from '../../../infrastructure/persistence/twenty-crm/repositories/twenty-crm-accommodations.repository';
import { TwentyCrmClientsRepository } from '../../../infrastructure/persistence/twenty-crm/repositories/twenty-crm-clients.repository';
import { TwentyCrmRentalsRepository } from '../../../infrastructure/persistence/twenty-crm/repositories/twenty-crm-rentals.repository';
import { sampleLocation, samplePrice, validTestPhoneNumber } from '../../__fixtures__/value-objects';

describe('TwentyCrmAccommodationsRepository (integration)', () => {
  const clientMapper = new ClientsTwentyCrmMapper();
  const clientRepo = new TwentyCrmClientsRepository(clientMapper, client);

  const rentalMapper = new RentalsTwentyCrmMapper();
  const rentalRepo = new TwentyCrmRentalsRepository(rentalMapper, client);

  const mapper = new TwentyCrmAccommodationsMapper();
  const repository = new TwentyCrmAccommodationsRepository(mapper, client);

  let cleanupClientId: ClientId | undefined;
  let cleanupRentalId: RentalId | undefined;
  let cleanupAccommodationId: AccommodationId | undefined;

  beforeAll(() => {
    client.setConfig({
      baseURL: 'http://localhost:3000/rest',
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZTA1OGFiMC01OTliLTRkZTktYmNkZS01YmJjMGMxNDNjY2EiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiOWUwNThhYjAtNTk5Yi00ZGU5LWJjZGUtNWJiYzBjMTQzY2NhIiwiaWF0IjoxNzQ0NDEzMTA2LCJleHAiOjQ4OTgwMTY3MDUsImp0aSI6ImUwYWI2ZmFjLTczNWYtNDg5NS1iNzFkLTEzNTExNzM1MWRhZSJ9.zdPLPrjd_EguVz32NcyHiKfdDNb7FtD67L4HoOiHevM`,
      },
    });
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
});
