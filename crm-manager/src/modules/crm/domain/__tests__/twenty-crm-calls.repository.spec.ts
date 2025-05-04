import { client } from 'twenty-crm-api-client/client/client.gen';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { TwentyCrmCallsMapper } from '../../infrastructure/persistence/twenty-crm/mappers/twenty-crm-calls.mapper';
import { TwentyCrmCallsRepository } from '../../infrastructure/persistence/twenty-crm/repositories/twenty-crm-calls.repository';
import { Call, CallId, CallType } from '../entities/call';
import { PhoneNumber } from '../value-objects/phone-number.value';
import { SpeakerRole, Transcript, TranscriptReplica } from '../value-objects/transcript.value';
import { validTestPhoneNumber } from './__fixtures__/value-objects';

describe('TwentyCrmCallsRepository (integration)', () => {
  const mapper = new TwentyCrmCallsMapper();
  const repository = new TwentyCrmCallsRepository(mapper, client);
  let cleanupCallId: CallId | undefined;

  beforeAll(() => {
    client.setConfig({
      baseURL: 'http://localhost:3000/rest',
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZTA1OGFiMC01OTliLTRkZTktYmNkZS01YmJjMGMxNDNjY2EiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiOWUwNThhYjAtNTk5Yi00ZGU5LWJjZGUtNWJiYzBjMTQzY2NhIiwiaWF0IjoxNzQ0NDEzMTA2LCJleHAiOjQ4OTgwMTY3MDUsImp0aSI6ImUwYWI2ZmFjLTczNWYtNDg5NS1iNzFkLTEzNTExNzM1MWRhZSJ9.zdPLPrjd_EguVz32NcyHiKfdDNb7FtD67L4HoOiHevM`,
      },
    });
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
});
