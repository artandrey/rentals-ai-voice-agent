import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

import { IAudioStorage } from '../../application/boundaries/audio-storage.interface';

@Injectable()
export class AudioStorageS3Service implements IAudioStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly expiresIn = 3600;

  constructor(options: { bucket: string; region: string; credentials?: any }) {
    this.bucket = options.bucket;
    this.region = options.region;
    this.client = new S3Client({ region: this.region, credentials: options.credentials });
  }

  async getPublicUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: this.expiresIn });
  }
}
