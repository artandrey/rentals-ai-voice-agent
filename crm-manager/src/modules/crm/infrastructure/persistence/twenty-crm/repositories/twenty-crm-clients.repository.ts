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

    // Check if entity has an ID to determine if it's an update or create
    if (entity.id) {
      try {
        const { data: response } = await this.clientsService.updateOneClient({
          path: { id: entity.id },
          body: persistenceData, // Should use Client_for_Update type ideally
          // query: { depth: 0 } // Typically don't need full response on update
        });

        if (!response?.data?.updateClient?.id) {
          throw new Error('Failed to update client in TwentyCRM: No ID returned');
        }
        return response.data.updateClient.id as ClientId;
      } catch (error: any) {
        if (error?.status === 404) {
          throw new NotFoundException(`Client with ID ${entity.id} not found for update.`);
        }
        throw error;
      }
    } else {
      try {
        const { data: response } = await this.clientsService.createOneClient({
          body: persistenceData,
        });

        if (!response?.data?.createClient?.id) {
          throw new Error('Failed to create client in TwentyCRM: No ID returned');
        }
        return response.data.createClient.id as ClientId;
      } catch (error) {
        console.error('Error creating client in TwentyCRM:', error);
        throw error;
      }
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
    try {
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

      if (clients.length > 1) {
        // Handle case where multiple clients have the same phone number if necessary
        console.warn(`Multiple clients found with phone number ${phoneNumber}. Returning the first one.`);
      }

      return this.mapper.toDomain(clients[0]);
    } catch (error) {
      console.error('Error finding client by phone number from TwentyCRM:', error);
      throw error;
    }
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
