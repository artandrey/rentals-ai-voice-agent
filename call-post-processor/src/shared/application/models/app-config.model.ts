import { IsString } from 'class-validator';

export class AppConfigModel {
  @IsString()
  TEST: string;

  @IsString()
  DB_URL: string;

  @IsString()
  STRAPI_URL: string;

  @IsString()
  STRAPI_TOKEN: string;

  @IsString()
  TELEGRAM_BOT_TOKEN: string;

  @IsString()
  STORE_WEB_APP_URL: string;
}
