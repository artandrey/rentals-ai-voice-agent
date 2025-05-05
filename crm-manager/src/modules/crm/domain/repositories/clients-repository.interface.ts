import { IBaseRepository } from '~shared/domain/repositories/base-repository.interface';

import { Client, ClientId } from '../entities/client';
import { PhoneNumber } from '../value-objects/phone-number.value';

export abstract class IClientRepository implements IBaseRepository<Client, ClientId> {
  abstract findById(id: ClientId): Promise<Client | null>;
  abstract save(entity: Client): Promise<ClientId>;
  abstract delete(id: ClientId): Promise<void>;
  abstract findByPhoneNumber(phoneNumber: PhoneNumber): Promise<Client | null>;
}
