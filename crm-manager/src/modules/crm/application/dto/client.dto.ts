import { IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Matches, MinLength } from 'class-validator';

import { ClientId, ClientPreferredLanguage } from '../../domain/entities/client';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+\d+$/, { message: 'Phone number must start with + followed by country code and number' })
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phoneNumber: string;

  @IsString()
  @IsOptional()
  middleName?: string;
}

export class ClientDto {
  id: ClientId;
  firstName: string;
  lastName: string;
  middleName: string | null = null;
  phoneNumber: string;
  preferredLanguage: ClientPreferredLanguage | null = null;
  preferences: string[] = [];
  note: string | null = null;
}

export class UpdateClientNameDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  lastName: string;

  @IsString()
  @IsOptional()
  middleName?: string;
}

export class UpdateClientPreferredLanguageDto {
  @IsEnum(ClientPreferredLanguage, { message: 'Language must be either EN or UK' })
  @IsNotEmpty()
  language: ClientPreferredLanguage;
}

export class UpdateClientPreferencesDto {
  @IsString({ each: true })
  @IsNotEmpty()
  preferences: string[];
}
