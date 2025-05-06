import { Injectable } from '@nestjs/common';
import { ClientForResponse as ClientTwentyCrm, Client as ClientTwentyCrmInput } from 'twenty-crm-api-client';

import { Client, ClientId, ClientPreferredLanguage } from '~modules/crm/domain/entities/client';
import { PhoneNumber } from '~modules/crm/domain/value-objects/phone-number.value';
import { IDataAccessMapper } from '~shared/domain/mappers/data-access-mapper.interface';

@Injectable()
export class TwentyCrmClientsMapper implements IDataAccessMapper<Client, ClientTwentyCrm> {
  toPersistence(entity: Client): ClientTwentyCrmInput {
    return {
      fistname: entity.firstName,
      lastname: entity.lastName,
      middlename: entity.middleName ?? undefined,
      phonenumber: {
        primaryPhoneNumber: entity.phoneNumber.number,
        primaryPhoneCallingCode: entity.phoneNumber.callingCode,
        primaryPhoneCountryCode: entity.phoneNumber.countryCode,
      },
      language: (entity.preferredLanguage as ClientTwentyCrmInput['language']) ?? undefined,
      note: entity.note ?? undefined,
      preferences: entity.preferences,
    };
  }

  toDomain(persistence: ClientTwentyCrm): Client {
    const builder = Client.builder(
      persistence.fistname!,
      persistence.lastname!,
      PhoneNumber.create(
        persistence.phonenumber!.primaryPhoneCallingCode! + persistence.phonenumber!.primaryPhoneNumber!,
      ),
    );

    if (persistence.id) {
      builder.id(persistence.id as ClientId);
    }

    if (persistence.middlename) {
      builder.middleName(persistence.middlename);
    }

    if (persistence.preferences) {
      builder.preferences(persistence.preferences);
    }

    if (persistence.language) {
      builder.preferredLanguage(persistence.language as ClientPreferredLanguage);
    }

    if (persistence.note) {
      builder.note(persistence.note);
    }

    return builder.build();
  }
}
