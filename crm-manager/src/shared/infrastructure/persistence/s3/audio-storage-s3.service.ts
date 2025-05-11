import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

import { IAudioStorage } from '../../../application/services/audio-storage.interface';

@Injectable()
export class AudioStorageS3Service implements IAudioStorage {
  private readonly expiresIn = 3600;

  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}

  async getPublicUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: this.expiresIn });
  }
}
