import { Inject, Injectable, Scope } from '@nestjs/common';

import { EventDrivenCore, IEvent, IEventBus } from 'src/lib/nest-event-driven';

import { IEventDispatcher } from '../event-dispatcher.interface';

@Injectable({ scope: Scope.REQUEST })
export class EventDispatcher implements IEventDispatcher {
  private events: IEvent[] = [];

  constructor(@Inject(EventDrivenCore.EVENT_BUS) private readonly integrationService: IEventBus) {}

  registerEvent(event: IEvent): void {
    this.events.push(event);
  }

  dispatchEvents(): void {
    if (!this.events.length) return;

    this.integrationService.publishAll(this.events);
  }
}
