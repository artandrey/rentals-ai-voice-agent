import { IsNumber, IsString } from 'class-validator';

export class AppConfigModel {
  @IsString()
  TWENTY_API_KEY: string;

  @IsString()
  TWENTY_API_URL: string;

  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  REDIS_PORT: number;

  @IsString()
  S3_ENDPOINT_URL: string;
  @IsString()
  S3_BUCKET: string;

  @IsString()
  AWS_REGION: string;

  @IsString()
  AWS_ACCESS_KEY_ID: string;

  @IsString()
  AWS_SECRET_ACCESS_KEY: string;
}
