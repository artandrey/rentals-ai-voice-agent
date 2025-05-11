import { Injectable } from '@nestjs/common';

import { CreateCallDto } from '~modules/crm/application/dto/call.dto';
import { ICreateCallUseCase } from '~modules/crm/application/use-cases/create-call.use-case';
import { CallType } from '~modules/crm/domain/entities/call';
import { SpeakerRole } from '~modules/crm/domain/value-objects/transcript.value';
import { CallCompletedEvent } from '~modules/post-processing/domain/events/call-completed.event';

import { ILlmService, Message } from '../boundaries/llm-service.interface';
import { SUMMARIZE_CALL_PROMPT } from '../prompts/summarize-call';

@Injectable()
export class CallCompletedHandler {
  constructor(
    private readonly llmService: ILlmService,
    private readonly createCallUseCase: ICreateCallUseCase,
  ) {}

  async handle(event: CallCompletedEvent): Promise<void> {
    const llmResult = await this.llmService.process([
      new Message('system', SUMMARIZE_CALL_PROMPT),
      new Message('user', event.transcript.map((replica) => `${replica.role}: ${replica.text}`).join('\n')),
    ]);
    const summary = llmResult.content;

    // {"intent":"info-or-emergency","clientId":"263fa1ef-6dec-412c-944d-a0378ce3068f","accommodationId":"cdb0b281-fdd0-47f6-9b41-92534289d6d2","transcript":[{"role":"assistant","text":"Hello Jake Johnson, welcome to AI Assistant Rentals! I'm your personal assistant, ready to help you with booking, settlement, or if you have any emergencies. How can I assist you today?"},{"role":"user","text":"Hello. House on fire."},{"role":"assistant","text":null},{"role":"assistant","text":"Let me proceed with this."},{"role":"assistant","text":null},{"role":"assistant","text":"Jake,
    //   here are the emergency instructions for fire. Do not use the elevator. Exit the apartment through the main door. Close the door behind you, but do not lock it. Use the stairs to reach the ground floor. Call the fire department at one zero one. Please do this now. Are you able to safely exit?"},{"role":"user","text":"Yes."},{"role":"assistant","text":null},{"role":"assistant","text":"Alright. Stay safe."},{"role":"assistant","text":"Okay Jake, I hope I
    //   was able to assist you. If you need anything else, please don't hesitate to call again. Goodbye!"}],"audioFileId":"full_conversation_recording20250511_205012.wav"}
    console.log('[CallCompletedHandler] Event payload:', JSON.stringify(event));

    // Map event to CreateCallDto
    const callDto: CreateCallDto = {
      callerPhoneNumber: event.callerPhoneNumber,
      type: this.mapIntentToCallType(event.intent),
      clientId: event.clientId,
      associatedRentalId: event.accommodationId,
      transcript: {
        replicas: event.transcript.map((replica) => ({
          role: this.mapReplicaRole(replica.role),
          text: replica.text,
        })),
      },
      audioFileId: event.audioFileId,
      summary,
    };

    await this.createCallUseCase.execute(callDto);
  }

  private mapIntentToCallType(intent: string): CallType | undefined {
    if (intent === 'info-or-emergency') {
      return CallType.INFORMATIVE;
    }
    if (intent === 'booking') {
      return CallType.BOOKING;
    }
    if (intent === 'settlement') {
      return CallType.SETTLEMENT;
    }
    return undefined;
  }

  private mapReplicaRole(role: string): SpeakerRole {
    if (role === 'user') {
      return SpeakerRole.CALLER;
    }
    if (role === 'assistant') {
      return SpeakerRole.AGENT;
    }
    throw new Error(`Unknown speaker role: ${role}`);
  }
}
