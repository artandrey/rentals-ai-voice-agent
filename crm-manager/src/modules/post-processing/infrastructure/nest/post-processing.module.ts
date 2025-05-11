import { S3Client } from '@aws-sdk/client-s3';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { IAppConfigService } from '~shared/application/services/app-config-service.interface';
import { BaseToken } from '~shared/constants';

import { CallCompletedHandler } from '../../application/handlers/call-completed.handler';
import { CallCompletedProcessor } from '../bull/call-completed.processor';
import { AudioStorageS3Service } from '../s3/audio-storage-s3.service';

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
  providers: [
    CallCompletedProcessor,
    CallCompletedHandler,
    {
      provide: S3Client,
      useFactory: (config: IAppConfigService) =>
        new S3Client({
          region: config.get('AWS_REGION', { infer: true }),
          endpoint: config.get('S3_ENDPOINT_URL', { infer: true }),
          credentials: {
            accessKeyId: config.get('AWS_ACCESS_KEY_ID', { infer: true }),
            secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY', { infer: true }),
          },
        }),
      inject: [BaseToken.APP_CONFIG],
    },
    {
      provide: AudioStorageS3Service,
      useFactory: (client: S3Client, config: IAppConfigService) =>
        new AudioStorageS3Service(client, config.get('S3_BUCKET', { infer: true })),
      inject: [S3Client, BaseToken.APP_CONFIG],
    },
  ],
})
export class PostProcessingModule {}
