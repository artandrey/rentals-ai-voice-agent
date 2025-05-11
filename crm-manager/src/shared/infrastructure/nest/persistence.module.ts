import { S3Client } from '@aws-sdk/client-s3';
import { Global, Inject, Module, OnModuleInit } from '@nestjs/common';
import { client } from 'twenty-crm-api-client/client/client.gen';

import { IAppConfigService } from '~shared/application/services/app-config-service.interface';
import { BaseToken } from '~shared/constants';

import { TWENTY_CRM_CLIENT } from '../persistence/constants';
import { AudioStorageS3Service } from '../persistence/s3/audio-storage-s3.service';
import { TwentyCrmDbContext } from '../persistence/twenty-crm/db-context/twenty-crm-db-context';
import { persistence } from './providers';

@Global()
@Module({
  imports: [],
  providers: [
    { provide: BaseToken.DB_CONTEXT, useClass: TwentyCrmDbContext },
    ...persistence,
    {
      provide: TWENTY_CRM_CLIENT,
      useValue: client,
    },
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
  exports: [BaseToken.DB_CONTEXT],
})
export class PersistenceModule implements OnModuleInit {
  constructor(@Inject(BaseToken.APP_CONFIG) private readonly appConfig: IAppConfigService) {}

  onModuleInit() {
    client.setConfig({
      baseURL: this.appConfig.get('TWENTY_API_URL'),
      headers: {
        Authorization: `Bearer ${this.appConfig.get('TWENTY_API_KEY')}`,
      },
    });
  }
}
