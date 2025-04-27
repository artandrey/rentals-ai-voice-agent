import { IEvent } from 'src/lib/nest-event-driven';

export abstract class InfrastructureEvent<TPayload extends object> implements IEvent<TPayload> {
  constructor(public readonly payload: Readonly<TPayload>) {}
}
