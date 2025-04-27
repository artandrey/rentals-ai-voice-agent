import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { IEvent, IEventPublisher } from 'src/lib/nest-event-driven';

@Injectable()
export class EventEmitterEventPublisher implements IEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish<E extends IEvent<object>>(event: E): void {
    this.eventEmitter.emitAsync(event.constructor.name, event);
  }
  publishAll<E extends IEvent<object>>(events: E[]): void {
    events.map((event) => this.publish(event));
  }
}
