import { Injectable } from '@nestjs/common';
import { CallsService } from 'twenty-crm-api-client';
import { client as ApiClient } from 'twenty-crm-api-client/client/client.gen';

import { Call, CallId } from '~modules/crm/domain/entities/call';
import { IDataAccessMapper } from '~shared/domain/mappers/data-access-mapper.interface';

import { TwentyCrmCallsMapper } from '../mappers/twenty-crm-calls.mapper';

@Injectable()
export class TwentyCrmCallsRepository {
  private readonly callsService = CallsService;

  constructor(
    private readonly mapper: TwentyCrmCallsMapper,
    private readonly apiClient: typeof ApiClient,
  ) {}

  async findById(id: CallId): Promise<Call | null> {
    try {
      const { data: response } = await this.callsService.findOneCall({
        path: { id },
        client: this.apiClient,
      });
      if (!response?.data?.call) {
        return null;
      }
      return this.mapper.toDomain(response.data.call);
    } catch (error: any) {
      if (error?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async save(entity: Call): Promise<CallId> {
    const persistenceData = this.mapper.toPersistence(entity);
    if ((entity as any).id) {
      const { data: response } = await this.callsService.updateOneCall({
        path: { id: (entity as any).id },
        body: persistenceData,
        client: this.apiClient,
      });
      if (!response?.data?.updateCall?.id) {
        throw new Error('Failed to update call in TwentyCRM: No ID returned');
      }
      return response.data.updateCall.id as CallId;
    } else {
      const { data: response } = await this.callsService.createOneCall({
        body: persistenceData,
        client: this.apiClient,
      });
      if (!response?.data?.createCall?.id) {
        throw new Error('Failed to create call in TwentyCRM: No ID returned');
      }
      return response.data.createCall.id as CallId;
    }
  }

  async delete(id: CallId): Promise<void> {
    try {
      await this.callsService.deleteOneCall({
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

  async findAll(): Promise<Call[]> {
    const { data: response } = await this.callsService.findManyCalls({
      client: this.apiClient,
    });
    const callsData = response?.data?.calls ?? [];
    return callsData.map((callData) => this.mapper.toDomain(callData));
  }
}
