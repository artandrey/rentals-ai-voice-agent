import { Injectable } from '@nestjs/common';

@Injectable()
export class CallCompletedHandler {
  async handle(event: any): Promise<void> {
    // {"intent":"info-or-emergency","clientId":"263fa1ef-6dec-412c-944d-a0378ce3068f","accommodationId":"cdb0b281-fdd0-47f6-9b41-92534289d6d2","transcript":[{"role":"assistant","text":"Hello Jake Johnson, welcome to AI Assistant Rentals! I’m your personal assistant, ready to help you with booking, settlement, or if you have any emergencies. How can I assist you today?"},{"role":"user","text":"Hello. House on fire."},{"role":"assistant","text":null},{"role":"assistant","text":"Let me proceed with this."},{"role":"assistant","text":null},{"role":"assistant","text":"Jake,
    //   here are the emergency instructions for fire. Do not use the elevator. Exit the apartment through the main door. Close the door behind you, but do not lock it. Use the stairs to reach the ground floor. Call the fire department at one zero one. Please do this now. Are you able to safely exit?"},{"role":"user","text":"Yes."},{"role":"assistant","text":null},{"role":"assistant","text":"Alright. Stay safe."},{"role":"assistant","text":"Okay Jake, I hope I
    //   was able to assist you. If you need anything else, please don't hesitate to call again. Goodbye!"}],"audioFileId":"full_conversation_recording20250511_205012.wav"}
    console.log('[CallCompletedHandler] Event payload:', JSON.stringify(event));
  }
}
