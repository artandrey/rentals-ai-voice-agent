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
      transcript: transcriptToObject(entity.transcript),
      audioMetadata: {
        audioFileId: entity.audioFileId,
      },
      summary: entity.summary || undefined,
    };
  }

  toDomain(persistence: CallForResponse): Call {
    const phoneObj = persistence.callerPhoneNumber;
    const phone = phoneObj
      ? PhoneNumber.create(`${phoneObj.primaryPhoneCallingCode ?? ''}${phoneObj.primaryPhoneNumber ?? ''}`)
      : PhoneNumber.create('');

    const builder = Call.builder(phone);

    if (persistence.id) {
      builder.id(persistence.id as CallId);
    }

    if (persistence.callType) {
      builder.type(persistence.callType as CallType);
    }

    if (persistence.clientId) {
      builder.clientId(persistence.clientId as ClientId);
    }

    if (persistence.asociateedRentalId) {
      builder.associatedRentalId(persistence.asociateedRentalId as RentalId);
    }

    if (persistence.transcript) {
      const transcript = objectToTranscript(persistence.transcript);
      if (transcript) {
        builder.transcript(transcript);
      }
    }

    return builder.build();
  }
}
