enum CallIntent {
  INFO_OR_EMERGENCY = 'info-or-emergency',
  BOOKING = 'booking',
  SETTLEMENT = 'settlement',
}

class Replica {
  role: string;
  text: string;
}

export class CallCompletedEvent {
  intent: CallIntent;
  clientId: string;
  accommodationId: string;
  callerPhoneNumber: string;
  transcript: Replica[];
  audioFileId: string;
}
