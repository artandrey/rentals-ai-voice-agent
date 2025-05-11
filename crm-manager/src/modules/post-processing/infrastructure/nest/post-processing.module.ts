import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { IAppConfigService } from '~shared/application/services/app-config-service.interface';
import { BaseToken } from '~shared/constants';

import { CallCompletedHandler } from '../../application/handlers/call-completed.handler';
import { CallCompletedProcessor } from '../bull/call-completed.processor';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: IAppConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [BaseToken.APP_CONFIG],
    }),
    BullModule.registerQueue({ name: 'call-completed' }),
  ],
  providers: [CallCompletedProcessor, CallCompletedHandler],
})
export class PostProcessingModule {}
