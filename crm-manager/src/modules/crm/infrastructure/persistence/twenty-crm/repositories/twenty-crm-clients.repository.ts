import { Inject, Injectable } from '@nestjs/common';
import { type client as ApiClient } from 'twenty-crm-api-client/client/client.gen';
import { ClientsService } from 'twenty-crm-api-client/client/index';

import { Client, ClientId } from '~modules/crm/domain/entities/client';
import { IClientRepository } from '~modules/crm/domain/repositories/clients-repository.interface';
import { PhoneNumber } from '~modules/crm/domain/value-objects/phone-number.value';
import { TWENTY_CRM_CLIENT } from '~shared/infrastructure/persistence/constants';

import { TwentyCrmClientsMapper } from '../mappers/twenty-crm-clients.mapper';

@Injectable()
export class TwentyCrmClientsRepository extends IClientRepository {
  private readonly clientsService = ClientsService;

  constructor(
    private readonly mapper: TwentyCrmClientsMapper,
    @Inject(TWENTY_CRM_CLIENT) private readonly apiClient: typeof ApiClient,
  ) {
    super();
  }

  async findById(id: ClientId): Promise<Client | null> {
    try {
      const { data: response } = await this.clientsService.findOneClient({
        path: {
          id,
        },
        client: this.apiClient,
      });
      if (!response?.data?.client) {
        return null;
      }
      return this.mapper.toDomain(response.data.client);
    } catch (error: any) {
      if (error?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async save(entity: Client): Promise<ClientId> {
    const persistenceData = this.mapper.toPersistence(entity);
    if (entity.id) {
      const { data: response } = await this.clientsService.updateOneClient({
        path: { id: entity.id },
        body: persistenceData,
        client: this.apiClient,
      });
      if (!response?.data?.updateClient?.id) {
        throw new Error('Failed to update client in TwentyCRM: No ID returned');
      }
      return response.data.updateClient.id as ClientId;
    } else {
      const { data: response, error } = await this.clientsService.createOneClient({
        body: persistenceData,
        client: this.apiClient,
      });
      if (error) {
        throw error;
      }
      if (!response?.data?.createClient?.id) {
        throw new Error('Failed to create client in TwentyCRM: No ID returned');
      }
      return response.data.createClient.id as ClientId;
    }
  }

  async delete(id: ClientId): Promise<void> {
    try {
      await this.clientsService.deleteOneClient({
        path: { id },
        client: this.apiClient,
      });
    } catch (error: any) {
      if (error?.status === 404) {
        return;
      }
      throw error;
    }
  }

  async findByPhoneNumber(phoneNumber: PhoneNumber): Promise<Client | null> {
    const filter = `phonenumber.primaryPhoneNumber[eq]:${phoneNumber.number},phonenumber.primaryPhoneCallingCode[eq]:${phoneNumber.callingCode}`;
    const { data: response } = await this.clientsService.findManyClients({
      query: {
        filter,
        limit: 1,
      },
      client: this.apiClient,
    });

    const clients = response?.data?.clients ?? [];
    if (clients.length === 0) {
      return null;
    }
    return this.mapper.toDomain(clients[0]);
  }

  async findAll(): Promise<Client[]> {
    const { data: response } = await this.clientsService.findManyClients({
      client: this.apiClient,
    });
    const clientsData = response?.data?.clients ?? [];
    return clientsData.map((clientData) => this.mapper.toDomain(clientData));
  }
}
