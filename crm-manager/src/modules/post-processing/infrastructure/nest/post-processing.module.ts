import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CallCompletedHandler } from '../../application/handlers/call-completed.handler';
import { CallCompletedProcessor } from '../bull/call-completed.processor';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: Number(configService.get<string>('REDIS_PORT')),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'call-completed' }),
  ],
  providers: [CallCompletedProcessor, CallCompletedHandler],
})
export class PostProcessingModule {}
