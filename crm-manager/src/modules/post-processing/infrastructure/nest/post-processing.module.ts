import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import OpenAI from 'openai';

import { CrmModule } from '~modules/crm/infrastructure/nest/crm.module';
import { IAppConfigService } from '~shared/application/services/app-config-service.interface';
import { BaseToken } from '~shared/constants';

import { ILlmService } from '../../application/boundaries/llm-service.interface';
import { CallCompletedHandler } from '../../application/handlers/call-completed.handler';
import { CallCompletedProcessor } from '../bull/call-completed.processor';
import { OPENAI_CLIENT } from '../llm/openai/constants';
import { OpenAiLlmService } from '../llm/openai/openai-llm.service';

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
    CrmModule,
  ],
  providers: [
    CallCompletedProcessor,
    CallCompletedHandler,
    {
      provide: OPENAI_CLIENT,
      useFactory: (configService: IAppConfigService) => {
        return new OpenAI({
          apiKey: configService.get('OPENAI_API_KEY'),
        });
      },
      inject: [BaseToken.APP_CONFIG],
    },
    {
      provide: ILlmService,
      useClass: OpenAiLlmService,
    },
  ],
  exports: [ILlmService],
})
export class PostProcessingModule {}
