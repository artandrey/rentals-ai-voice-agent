export enum SpeakerRole {
  CALLER = 'caller',
  AGENT = 'agent',
}

export class TranscriptReplica {
  constructor(
    public readonly role: SpeakerRole,
    public readonly text: string,
  ) {}
}

export class Transcript {
  constructor(public readonly replicas: TranscriptReplica[]) {}
}
