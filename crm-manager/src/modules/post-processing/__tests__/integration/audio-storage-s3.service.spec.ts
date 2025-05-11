import { CreateBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { beforeAll, describe, expect, it } from 'vitest';

import { AudioStorageS3Service } from '../../infrastructure/s3/audio-storage-s3.service';

describe('AudioStorageS3Service (integration)', () => {
  const bucket = process.env.S3_BUCKET || 'audio';
  const endpoint = process.env.S3_ENDPOINT_URL || 'http://localhost:4566';
  const region = process.env.AWS_REGION || 'us-east-1';
  let s3Client: S3Client;
  let service: AudioStorageS3Service;
  const testKey = 'test-audio.txt';
  const testContent = 'Hello World';

  beforeAll(async () => {
    // Set AWS config for local testing
    process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'test';
    process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'test';
    process.env.S3_ENDPOINT_URL = endpoint;
    process.env.S3_BUCKET = bucket;
    process.env.AWS_REGION = region;

    s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });

    // Create the bucket
    await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
    // Upload a test object
    await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: testKey, Body: testContent }));

    service = new AudioStorageS3Service(s3Client, bucket);
  });

  it('should generate a signed URL for the object that is accessible for unauthenticated users', async () => {
    const url = await service.getPublicUrl(testKey);
    expect(url.startsWith(endpoint)).toBe(true);
    expect(url).toContain(`/${bucket}/${testKey}`);

    const response = await fetch(url);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe(testContent);
  });
});
