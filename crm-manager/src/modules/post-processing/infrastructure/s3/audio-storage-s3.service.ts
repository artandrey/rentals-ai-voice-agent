import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';

import { BaseToken } from '~shared/constants';

import { IAppConfigService } from '../../../../shared/application/services/app-config-service.interface';
import { IAudioStorage } from '../../application/boundaries/audio-storage.interface';

@Injectable()
export class AudioStorageS3Service implements IAudioStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly expiresIn = 3600;

  constructor(@Inject(BaseToken.APP_CONFIG) config: IAppConfigService) {
    this.bucket = config.get('S3_BUCKET', { infer: true });
    this.client = new S3Client({
      region: config.get('AWS_REGION', { infer: true }),
      endpoint: config.get('S3_ENDPOINT_URL', { infer: true }),
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID', { infer: true }),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY', { infer: true }),
      },
    });
  }

  async getPublicUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: this.expiresIn });
  }
}
