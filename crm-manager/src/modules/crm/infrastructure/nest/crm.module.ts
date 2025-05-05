import { Module } from '@nestjs/common';

import { CreateClientUseCase, ICreateClientUseCase } from '~modules/crm/application/use-cases/create-client.use-case';
import {
  FindClientByPhoneQuery,
  IFindClientByPhoneQuery,
} from '~modules/crm/application/use-cases/find-client-by-phone.use-case';
import { GetClientByIdQuery, IGetClientByIdQuery } from '~modules/crm/application/use-cases/get-client-by-id.use-case';
import { GetClientsQuery, IGetClientsQuery } from '~modules/crm/application/use-cases/get-clients.use-case';
import {
  IUpdateClientNameUseCase,
  UpdateClientNameUseCase,
} from '~modules/crm/application/use-cases/update-client-name.use-case';
import {
  IUpdateClientPreferencesUseCase,
  UpdateClientPreferencesUseCase,
} from '~modules/crm/application/use-cases/update-client-preferences.use-case';
import {
  IUpdateClientPreferredLanguageUseCase,
  UpdateClientPreferredLanguageUseCase,
} from '~modules/crm/application/use-cases/update-client-preferred-language.use-case';
import { ClientMapper } from '~modules/crm/domain/mappers/client.mapper';
import { ClientsController } from '~modules/crm/infrastructure/http/controllers/clients.controller';

@Module({
  imports: [],
  controllers: [ClientsController],
  providers: [
    ClientMapper,
    ClientMapper,
    { provide: IGetClientsQuery, useClass: GetClientsQuery },
    { provide: IGetClientByIdQuery, useClass: GetClientByIdQuery },
    { provide: IFindClientByPhoneQuery, useClass: FindClientByPhoneQuery },
    { provide: ICreateClientUseCase, useClass: CreateClientUseCase },
    { provide: IUpdateClientNameUseCase, useClass: UpdateClientNameUseCase },
    { provide: IUpdateClientPreferredLanguageUseCase, useClass: UpdateClientPreferredLanguageUseCase },
    { provide: IUpdateClientPreferencesUseCase, useClass: UpdateClientPreferencesUseCase },
  ],
})
export class CrmModule {}
