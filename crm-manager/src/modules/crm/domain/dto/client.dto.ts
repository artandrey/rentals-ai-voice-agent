import { ClientId, ClientPreferredLanguage } from '../entities/client';

export interface ClientDtoParams {
  id: ClientId;
  firstName: string;
  lastName: string;
  middleName: string | null;
  phoneNumber: string;
  preferredLanguage: ClientPreferredLanguage | null;
  preferences: string[];
  note: string | null;
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

  constructor(params: ClientDtoParams) {
    this.id = params.id;
    this.firstName = params.firstName;
    this.lastName = params.lastName;
    this.middleName = params.middleName;
    this.phoneNumber = params.phoneNumber;
    this.preferredLanguage = params.preferredLanguage;
    this.preferences = params.preferences;
    this.note = params.note;
  }
}
