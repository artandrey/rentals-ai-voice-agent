import { Injectable } from '@nestjs/common';

import { ClientDto } from '../../application/dto/client.dto';
import { ClientId, ClientPreferredLanguage } from '../entities/client';
import { Client } from '../entities/client';

@Injectable()
export class ClientMapper {
  public toDto(client: Client): ClientDto {
    return {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      middleName: client.middleName,
      phoneNumber: client.phoneNumber.fullNumber,
      preferredLanguage: client.preferredLanguage,
      preferences: client.preferences,
      note: client.note,
    };
  }
}
