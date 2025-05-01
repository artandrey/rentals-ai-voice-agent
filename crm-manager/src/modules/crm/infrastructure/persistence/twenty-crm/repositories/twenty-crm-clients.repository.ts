import { Injectable, NotFoundException } from '@nestjs/common';
import { Client_for_Response as ClientTwentyCrm, ClientsService } from 'twenty-crm-api-client';

import { Client, ClientId } from '~modules/crm/domain/entities/client';
import { IClientRepository } from '~modules/crm/domain/repositories/clients-repository.interface';

import { ClientsTwentyCrmMapper } from '../mappers/twenty-crm-clients.mapper';

@Injectable()
export class TwentyCrmClientsRepository extends IClientRepository {
  private readonly clientsService = ClientsService;

  constructor(private readonly mapper: ClientsTwentyCrmMapper) {
    super();
  }

  async findById(id: ClientId): Promise<Client | null> {
    try {
      const { data: response } = await this.clientsService.findOneClient({
        path: {
          id,
        },
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
      });

      if (!response?.data?.updateClient?.id) {
        throw new Error('Failed to update client in TwentyCRM: No ID returned');
      }
      return response.data.updateClient.id as ClientId;
    } else {
      const { data: response } = await this.clientsService.createOneClient({
        body: persistenceData,
      });

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
      });
    } catch (error: any) {
      if (error?.status === 404) {
        return;
      }
      throw error;
    }
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Client | null> {
    const { data: response } = await this.clientsService.findManyClients({
      query: {
        filter: `phonenumber.primaryPhoneNumber[eq]:${phoneNumber}`,
        limit: 1,
      },
    });

    const clients = response?.data?.clients ?? [];

    if (clients.length === 0) {
      return null;
    }

    return this.mapper.toDomain(clients[0]);
  }

  async findAll(): Promise<Client[]> {
    try {
      const { data: response } = await this.clientsService.findManyClients({
        // Add query parameters like pagination (limit, starting_after) if needed
        // query: { depth: 1 }
      });

      const clientsData = response?.data?.clients ?? [];
      return clientsData.map((clientData) => this.mapper.toDomain(clientData));
    } catch (error) {
      console.error('Error finding all clients from TwentyCRM:', error);
      throw error;
    }
  }
}
