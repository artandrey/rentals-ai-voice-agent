import { Injectable, Scope } from '@nestjs/common';

import { Call, CallType } from '~modules/crm/domain/entities/call';
import { CallMapper } from '~modules/crm/domain/mappers/call.mapper';
import { PhoneNumber } from '~modules/crm/domain/value-objects/phone-number.value';
import { SpeakerRole, Transcript, TranscriptReplica } from '~modules/crm/domain/value-objects/transcript.value';
import { Command } from '~shared/application/CQS/command.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { CallDto, CreateCallDto } from '../dto/call.dto';

export abstract class ICreateCallUseCase
  extends Command<CreateCallDto, CallDto>
  implements IUseCase<CreateCallDto, CallDto> {}

@Injectable({ scope: Scope.REQUEST })
export class CreateCallUseCase extends ICreateCallUseCase {
  constructor(private readonly callMapper: CallMapper) {
    super();
  }

  async implementation(): Promise<CallDto> {
    const { callerPhoneNumber, type, clientId, associatedRentalId, transcript, audioFileId, summary } = this._input;

    // Build Transcript
    const transcriptObj = new Transcript(
      transcript.replicas.map((replica) => new TranscriptReplica(replica.role, replica.text)),
    );

    // Build Call entity
    const callBuilder = Call.builder(PhoneNumber.create(callerPhoneNumber));
    callBuilder.transcript(transcriptObj);
    if (type) callBuilder.type(type);
    if (clientId) callBuilder.clientId(clientId as any); // Cast to ClientId
    if (associatedRentalId) callBuilder.associatedRentalId(associatedRentalId as any); // Cast to RentalId
    if (audioFileId) callBuilder.audioFileId(audioFileId);
    if (summary) callBuilder.summary(summary);

    const call = callBuilder.build();
    const callId = await this._dbContext.callsRepository.save(call);
    const savedCall = await this._dbContext.callsRepository.findById(callId);
    if (!savedCall) {
      throw new Error('Failed to retrieve saved call');
    }
    return this.callMapper.toDto(savedCall);
  }
}
