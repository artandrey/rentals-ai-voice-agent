import { Global, Inject, Module, OnApplicationBootstrap, Scope } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { EventBus, EventDrivenCore, EventDrivenModule, IEventBus } from 'src/lib/nest-event-driven/';

import { EventDispatcher } from './application/events/event-dispatcher/implementation/event-dispatcher.interface';
import { AppConfigModel } from './application/models/app-config.model';
import { BaseToken } from './constants';
import { EventEmitterEventPublisher } from './infrastructure/events/publishers/event-emitter/event-emitter.event-publisher';
import { DatabaseModule } from './infrastructure/persistence/database.module';
import { TelegramModule } from './infrastructure/telegram/telegram.module';
import { validateConfig } from './infrastructure/util/validate-config';

@Global()
@Module({
  imports: [
    EventDrivenModule,
    EventEmitterModule.forRoot({ wildcard: true }),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => validateConfig(config, AppConfigModel),
      ignoreEnvFile: false,
      envFilePath: ['./config/.env', './config/.env.local'],
    }),
    DatabaseModule,
    TelegramModule,
  ],
  providers: [
    { provide: BaseToken.APP_CONFIG, useClass: ConfigService },
    EventEmitterEventPublisher,
    {
      provide: BaseToken.EVENT_DISPATCHER,
      useClass: EventDispatcher,
    },
  ],
  exports: [BaseToken.APP_CONFIG, BaseToken.EVENT_DISPATCHER],
})
export class SharedModule implements OnApplicationBootstrap {
  constructor(
    @Inject(EventDrivenCore.EVENT_BUS) private readonly eventBus: EventBus,
    private readonly eventPublisher: EventEmitterEventPublisher,
  ) {}

  async onApplicationBootstrap() {
    this.eventBus.publisher = this.eventPublisher;
  }
}
