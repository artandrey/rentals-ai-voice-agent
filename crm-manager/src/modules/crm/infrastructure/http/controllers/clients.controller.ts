import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';

import { ClientAccommodationDto } from '~modules/crm/application/dto/accommodation.dto';
import {
  ClientDto,
  CreateClientDto,
  UpdateClientNameDto,
  UpdateClientPreferencesDto,
  UpdateClientPreferredLanguageDto,
} from '~modules/crm/application/dto/client.dto';
import { ICreateClientUseCase } from '~modules/crm/application/use-cases/create-client.use-case';
import { IFindClientByPhoneQuery } from '~modules/crm/application/use-cases/find-client-by-phone.use-case';
import { IGetClientByIdQuery } from '~modules/crm/application/use-cases/get-client-by-id.use-case';
import { IGetCurrentClientAccommodationQuery } from '~modules/crm/application/use-cases/get-current-client-accommodation.use-case';
import { IUpdateClientNameUseCase } from '~modules/crm/application/use-cases/update-client-name.use-case';
import { IUpdateClientPreferencesUseCase } from '~modules/crm/application/use-cases/update-client-preferences.use-case';
import { IUpdateClientPreferredLanguageUseCase } from '~modules/crm/application/use-cases/update-client-preferred-language.use-case';
import { ClientId } from '~modules/crm/domain/entities/client';

import { PhoneValidationPipe } from '../pipes/phone-validation.pipe';

@Controller('clients')
export class ClientsController {
  constructor(
    private readonly getClientByIdQuery: IGetClientByIdQuery,
    private readonly findClientByPhoneQuery: IFindClientByPhoneQuery,
    private readonly createClientUseCase: ICreateClientUseCase,
    private readonly updateClientNameUseCase: IUpdateClientNameUseCase,
    private readonly updateClientPreferredLanguageUseCase: IUpdateClientPreferredLanguageUseCase,
    private readonly updateClientPreferencesUseCase: IUpdateClientPreferencesUseCase,
    private readonly getCurrentClientAccommodationQuery: IGetCurrentClientAccommodationQuery,
  ) {}

  @Get(':id')
  async getClientById(@Param('id', ParseUUIDPipe) id: string): Promise<ClientDto> {
    return this.getClientByIdQuery.execute({ clientId: id as ClientId });
  }

  @Get('phone/:phoneNumber')
  async findClientByPhone(@Param('phoneNumber', PhoneValidationPipe) phoneNumber: string): Promise<ClientDto> {
    return this.findClientByPhoneQuery.execute({ phoneNumber });
  }

  @Post()
  async createClient(@Body() createClientDto: CreateClientDto): Promise<ClientDto> {
    return this.createClientUseCase.execute(createClientDto);
  }

  @Put(':id/name')
  async updateClientName(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateClientNameDto): Promise<void> {
    await this.updateClientNameUseCase.execute({
      clientId: id as ClientId,
      updates: body,
    });
  }

  @Put(':id/preferred-language')
  async updateClientPreferredLanguage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateClientPreferredLanguageDto,
  ): Promise<void> {
    await this.updateClientPreferredLanguageUseCase.execute({
      clientId: id as ClientId,
      updates: body,
    });
  }

  @Put(':id/preferences')
  async updateClientPreferences(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateClientPreferencesDto,
  ): Promise<void> {
    await this.updateClientPreferencesUseCase.execute({
      clientId: id as ClientId,
      updates: body,
    });
  }

  @Get(':id/current-accommodation')
  async getCurrentAccommodation(@Param('id', ParseUUIDPipe) id: string): Promise<ClientAccommodationDto> {
    return this.getCurrentClientAccommodationQuery.execute({ clientId: id });
  }
}
