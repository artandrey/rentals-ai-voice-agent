import { NotFoundException } from '~core/exceptions/domain/exceptions/not-found-exception/not-found.exception';

import { ClientId } from '../entities/client';

export class ClientNotFoundException extends NotFoundException {
  constructor(clientId: ClientId) {
    super('CLIENT_NOT_FOUND', `Client with ID ${clientId} was not found`);
  }
}
