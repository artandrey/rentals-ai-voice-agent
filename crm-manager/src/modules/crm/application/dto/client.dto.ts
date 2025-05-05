import { ClientId, ClientPreferredLanguage } from '../../domain/entities/client';

export class CreateClientDto {
  firstName: string;
  lastName: string;
  phoneNumber: string;
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
  firstName: string;
  lastName: string;
  middleName?: string;
}

export class UpdateClientPreferredLanguageDto {
  language: ClientPreferredLanguage;
}

export class UpdateClientPreferencesDto {
  preferences: string[];
}
