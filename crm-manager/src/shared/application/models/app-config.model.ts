import { IsString } from 'class-validator';

export class AppConfigModel {
  @IsString()
  TWENTY_API_KEY: string;

  @IsString()
  TWENTY_API_URL: string;
}
