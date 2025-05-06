import { client } from 'twenty-crm-api-client/client/client.gen';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Call, CallId, CallType } from '../../../domain/entities/call';
import { PhoneNumber } from '../../../domain/value-objects/phone-number.value';
import { SpeakerRole, Transcript, TranscriptReplica } from '../../../domain/value-objects/transcript.value';
import { TwentyCrmCallsMapper } from '../../../infrastructure/persistence/twenty-crm/mappers/twenty-crm-calls.mapper';
import { TwentyCrmCallsRepository } from '../../../infrastructure/persistence/twenty-crm/repositories/twenty-crm-calls.repository';
import { getTwentyCrmClientConfig } from '../../__fixtures__/twenty-crm-client-config';
import { validTestPhoneNumber } from '../../__fixtures__/value-objects';

describe('TwentyCrmCallsRepository (integration)', () => {
  const mapper = new TwentyCrmCallsMapper();
  const repository = new TwentyCrmCallsRepository(mapper, client);
  let cleanupCallId: CallId | undefined;

  beforeAll(() => {
    client.setConfig(getTwentyCrmClientConfig());
  });

  afterEach(async () => {
    if (cleanupCallId) {
      await repository.delete(cleanupCallId);
      cleanupCallId = undefined;
    }
  });

  it('should create a call (save)', async () => {
    const testPhone = validTestPhoneNumber();
    const transcript = new Transcript([
      new TranscriptReplica(SpeakerRole.CALLER, 'Hello'),
      new TranscriptReplica(SpeakerRole.AGENT, 'Hi!'),
    ]);
    const callEntity = Call.builder(PhoneNumber.create(testPhone))
      .type(CallType.BOOKING)
      .transcript(transcript)
      .build();
    const id = await repository.save(callEntity);
    expect(id).toBeDefined();
    cleanupCallId = id;
  });

  it('should find a call by id', async () => {
    const testPhone = validTestPhoneNumber();
    const transcript = new Transcript([
      new TranscriptReplica(SpeakerRole.CALLER, 'Hello'),
      new TranscriptReplica(SpeakerRole.AGENT, 'Hi!'),
    ]);
    const callEntity = Call.builder(PhoneNumber.create(testPhone))
      .type(CallType.BOOKING)
      .transcript(transcript)
      .build();
    const id = await repository.save(callEntity);
    cleanupCallId = id;
    const found = await repository.findById(id);
    expect(found).not.toBeNull();
    expect(found?.callerPhoneNumber.fullNumber).toContain(testPhone.replace('+', ''));
    expect(found?.type).toBe(CallType.BOOKING);
    expect(found?.transcript).toBeDefined();
  });

  it('should return all calls (findAll)', async () => {
    const all = await repository.findAll();
    expect(Array.isArray(all)).toBe(true);
  });

  it('should delete a call', async () => {
    const testPhone = validTestPhoneNumber();
    const callEntity = Call.builder(PhoneNumber.create(testPhone)).type(CallType.BOOKING).build();
    const id = await repository.save(callEntity);
    await repository.delete(id);
    const found = await repository.findById(id);
    expect(found).toBeNull();
  });

  it('should handle 404 errors when finding a call by ID', async () => {
    const nonExistentId = 'non-existent-id' as CallId;
    const found = await repository.findById(nonExistentId);
    expect(found).toBeNull();
  });

  it('should handle 404 errors when deleting a non-existent call', async () => {
    const nonExistentId = 'non-existent-id' as CallId;
    // This should not throw an error
    await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
  });

  it('should throw errors for failed create operations', async () => {
    // Create a call with invalid data
    const invalidCall = {} as any;
    await expect(repository.save(invalidCall)).rejects.toThrow();
  });
});
