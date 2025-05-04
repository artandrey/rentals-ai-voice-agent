import { Injectable } from '@nestjs/common';
import { CallForResponse, Call as CallTwentyCrm } from 'twenty-crm-api-client';

import { Call, CallId, CallType } from '~modules/crm/domain/entities/call';
import { ClientId } from '~modules/crm/domain/entities/client';
import { RentalId } from '~modules/crm/domain/entities/rental';
import { PhoneNumber } from '~modules/crm/domain/value-objects/phone-number.value';
import { SpeakerRole, Transcript, TranscriptReplica } from '~modules/crm/domain/value-objects/transcript.value';
import { IDataAccessMapper } from '~shared/domain/mappers/data-access-mapper.interface';

function transcriptToObject(
  transcript?: Transcript,
): { [key: string]: { role: SpeakerRole; text: string } } | undefined {
  if (!transcript) return undefined;
  const obj: { [key: string]: { role: SpeakerRole; text: string } } = {};
  transcript.replicas.forEach((replica, idx) => {
    obj[idx] = { role: replica.role, text: replica.text };
  });
  return obj;
}

function objectToTranscript(obj?: { [key: string]: any }): Transcript | undefined {
  if (!obj) return undefined;
  const replicas: TranscriptReplica[] = Object.values(obj).map(
    (rep: any) => new TranscriptReplica(rep.role as SpeakerRole, rep.text),
  );
  return new Transcript(replicas);
}

@Injectable()
export class TwentyCrmCallsMapper implements IDataAccessMapper<Call, CallForResponse> {
  toPersistence(entity: Call): CallTwentyCrm {
    return {
      callerPhoneNumber: {
        primaryPhoneCallingCode: entity.callerPhoneNumber.callingCode,
        primaryPhoneNumber: entity.callerPhoneNumber.number,
        primaryPhoneCountryCode: entity.callerPhoneNumber.countryCode,
      },
      callType: entity.type ?? undefined,
      clientId: entity.clientId ?? undefined,
      asociateedRentalId: entity.associatedRentalId ?? undefined,
      startedAt: entity.startedAt?.toISOString(),
      completedAt: entity.completedAt?.toISOString(),
      transcript: transcriptToObject(entity.transcript),
    };
  }

  toDomain(persistence: CallForResponse): Call {
    const phoneObj = persistence.callerPhoneNumber;
    const phone = phoneObj
      ? PhoneNumber.create(`${phoneObj.primaryPhoneCallingCode ?? ''}${phoneObj.primaryPhoneNumber ?? ''}`)
      : PhoneNumber.create('');
    const call = new Call(phone);
    (call as any).id = persistence.id as CallId;
    if (persistence.callType) (call as any)._type = persistence.callType as CallType;
    if (persistence.clientId) (call as any)._clientId = persistence.clientId as ClientId;
    if (persistence.asociateedRentalId) (call as any)._associatedRentalId = persistence.asociateedRentalId as RentalId;
    if (persistence.startedAt) (call as any)._startedAt = new Date(persistence.startedAt);
    if (persistence.completedAt) (call as any)._completedAt = new Date(persistence.completedAt);
    if (persistence.transcript) {
      (call as any)._transcript = objectToTranscript(persistence.transcript);
    }
    return call;
  }
}
