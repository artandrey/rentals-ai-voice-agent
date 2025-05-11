import { CallDto, TranscriptDto } from '~modules/crm/application/dto/call.dto';

import { Call } from '../entities/call';
import { Transcript } from '../value-objects/transcript.value';

export class CallMapper {
  toDto(call: Call): CallDto {
    return {
      id: call.id,
      callerPhoneNumber: call.callerPhoneNumber.fullNumber,
      type: call.type,
      clientId: call.clientId,
      associatedRentalId: call.associatedRentalId,
      transcript: this.transcriptToDto(call.transcript),
    };
  }

  transcriptToDto(transcript: Transcript): TranscriptDto {
    return {
      replicas: transcript.replicas.map((replica) => ({
        text: replica.text,
        role: replica.role,
      })),
    };
  }
}
