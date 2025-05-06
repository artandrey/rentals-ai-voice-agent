import { client } from 'twenty-crm-api-client/client/client.gen';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Client, ClientId, ClientPreferredLanguage } from '../../../domain/entities/client';
import { PhoneNumber } from '../../../domain/value-objects/phone-number.value';
import { TwentyCrmClientsMapper } from '../../../infrastructure/persistence/twenty-crm/mappers/twenty-crm-clients.mapper';
import { TwentyCrmClientsRepository } from '../../../infrastructure/persistence/twenty-crm/repositories/twenty-crm-clients.repository';
import { getTwentyCrmClientConfig } from '../../__fixtures__/twenty-crm-client-config';
import { validTestPhoneNumber } from '../../__fixtures__/value-objects';

describe('TwentyCrmClientsRepository (integration)', () => {
  const mapper = new TwentyCrmClientsMapper();
  const repository = new TwentyCrmClientsRepository(mapper, client);
  let cleanupClientId: ClientId | undefined;

  beforeAll(() => {
    client.setConfig(getTwentyCrmClientConfig());
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
  });

  it('should handle 404 errors when finding a client by ID', async () => {
    const nonExistentId = 'non-existent-id' as ClientId;
    const found = await repository.findById(nonExistentId);
    expect(found).toBeNull();
  });

  it('should handle 404 errors when deleting a non-existent client', async () => {
    const nonExistentId = 'non-existent-id' as ClientId;
    await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
  });

  it('should throw errors for failed create operations', async () => {
    const invalidClient = {} as any;
    await expect(repository.save(invalidClient)).rejects.toThrow();
  });
});
