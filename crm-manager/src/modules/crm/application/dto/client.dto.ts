import { ClientId, ClientPreferredLanguage } from '../../domain/entities/client';

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
