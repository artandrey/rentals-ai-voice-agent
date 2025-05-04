import { client } from 'twenty-crm-api-client/client/client.gen';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ClientsTwentyCrmMapper } from '../../infrastructure/persistence/twenty-crm/mappers/twenty-crm-clients.mapper';
import { TwentyCrmClientsRepository } from '../../infrastructure/persistence/twenty-crm/repositories/twenty-crm-clients.repository';
import { Client, ClientId, ClientPreferredLanguage } from '../entities/client';
import { PhoneNumber } from '../value-objects/phone-number.value';
import { validTestPhoneNumber } from './__fixtures__/value-objects';

describe('TwentyCrmClientsRepository (integration)', () => {
  const mapper = new ClientsTwentyCrmMapper();
  const repository = new TwentyCrmClientsRepository(mapper, client);
  let cleanupClientId: ClientId | undefined;
  let clientInstance: typeof client;

  beforeAll(() => {
    client.setConfig({
      baseURL: 'http://localhost:3000/rest',
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZTA1OGFiMC01OTliLTRkZTktYmNkZS01YmJjMGMxNDNjY2EiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiOWUwNThhYjAtNTk5Yi00ZGU5LWJjZGUtNWJiYzBjMTQzY2NhIiwiaWF0IjoxNzQ0NDEzMTA2LCJleHAiOjQ4OTgwMTY3MDUsImp0aSI6ImUwYWI2ZmFjLTczNWYtNDg5NS1iNzFkLTEzNTExNzM1MWRhZSJ9.zdPLPrjd_EguVz32NcyHiKfdDNb7FtD67L4HoOiHevM`,
      },
    });
  });

  afterEach(async () => {
    if (cleanupClientId) {
      await repository.delete(cleanupClientId);
      cleanupClientId = undefined;
    }
  });

  it('should create a client (save)', async () => {
    const testPhone = validTestPhoneNumber();
    const clientEntity = Client.builder('Test', 'User', PhoneNumber.create(testPhone))
      .preferredLanguage(ClientPreferredLanguage.ENGLISH)
      .note('Integration test client')
      .build();
    const id = await repository.save(clientEntity);
    expect(id).toBeDefined();
    cleanupClientId = id;
  });

  it('should find a client by id', async () => {
    const testPhone = validTestPhoneNumber();
    const clientEntity = Client.builder('Test', 'User', PhoneNumber.create(testPhone))
      .preferredLanguage(ClientPreferredLanguage.ENGLISH)
      .note('Integration test client')
      .build();
    const id = await repository.save(clientEntity);
    cleanupClientId = id;
    const found = await repository.findById(id);
    expect(found).not.toBeNull();
    expect(found?.firstName).toBe('Test');
    expect(found?.phoneNumber.fullNumber).toContain(testPhone.replace('+', ''));
  });

  it('should find a client by phone number', async () => {
    const testPhone = validTestPhoneNumber();
    const clientEntity = Client.builder('Test', 'User', PhoneNumber.create(testPhone))
      .preferredLanguage(ClientPreferredLanguage.ENGLISH)
      .note('Integration test client')
      .build();
    const id = await repository.save(clientEntity);
    cleanupClientId = id;

    const found = await repository.findByPhoneNumber(PhoneNumber.create(testPhone));
    expect(found).not.toBeNull();
    expect(found?.firstName).toBe('Test');
  });

  it('should return all clients (findAll)', async () => {
    const all = await repository.findAll();
    expect(Array.isArray(all)).toBe(true);
    // Do not assert all.length > 0, as CRM may be empty
  });

  it('should delete a client', async () => {
    const testPhone = validTestPhoneNumber();
    const clientEntity = Client.builder('Test', 'User', PhoneNumber.create(testPhone))
      .preferredLanguage(ClientPreferredLanguage.ENGLISH)
      .note('Integration test client')
      .build();
    const id = await repository.save(clientEntity);
    await repository.delete(id);
    const found = await repository.findById(id);
    expect(found).toBeNull();
    // No need to set cleanupClientId, already deleted
  });
});
