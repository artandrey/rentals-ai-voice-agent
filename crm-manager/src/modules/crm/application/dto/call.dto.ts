import { Call, CallType } from '~modules/crm/domain/entities/call';
import { SpeakerRole, Transcript } from '~modules/crm/domain/value-objects/transcript.value';

export class TranscriptReplicaDto {
  text: string;
  role: SpeakerRole;
}

export class TranscriptDto {
  replicas: TranscriptReplicaDto[];
}

export class CallDto {
  id: string;
  callerPhoneNumber: string;
  type: CallType | null;
  clientId: string | null;
  associatedRentalId: string | null;
  callDashboardUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
  transcript: TranscriptDto;
}
