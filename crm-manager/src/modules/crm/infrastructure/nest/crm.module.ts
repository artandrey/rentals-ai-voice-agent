import { Module } from '@nestjs/common';

import {
  ConfirmSettlementUseCase,
  IConfirmSettlementUseCase,
} from '~modules/crm/application/use-cases/confirm-settlement.use-case';
import {
  CreateBookingUseCase,
  ICreateBookingUseCase,
} from '~modules/crm/application/use-cases/create-booking.use-case';
import { CreateCallUseCase, ICreateCallUseCase } from '~modules/crm/application/use-cases/create-call.use-case';
import { CreateClientUseCase, ICreateClientUseCase } from '~modules/crm/application/use-cases/create-client.use-case';
import {
  FindClientByPhoneQuery,
  IFindClientByPhoneQuery,
} from '~modules/crm/application/use-cases/find-client-by-phone.use-case';
import { GetClientByIdQuery, IGetClientByIdQuery } from '~modules/crm/application/use-cases/get-client-by-id.use-case';
import {
  GetCurrentClientAccommodationQuery,
  IGetCurrentClientAccommodationQuery,
} from '~modules/crm/application/use-cases/get-current-client-accommodation.use-case';
import {
  GetRentalAvailableDateSpansQuery,
  IGetRentalAvailableDateSpansQuery,
} from '~modules/crm/application/use-cases/get-rental-available-date-spans.use-case';
import { GetRentalByIdQuery, IGetRentalByIdQuery } from '~modules/crm/application/use-cases/get-rental-by-id.use-case';
import {
  GetRentalEmergencyDetailsQuery,
  IGetRentalEmergencyDetailsQuery,
} from '~modules/crm/application/use-cases/get-rental-emergency-details.use-case';
import {
  GetRentalSettlementDetailsQuery,
  IGetRentalSettlementDetailsQuery,
} from '~modules/crm/application/use-cases/get-rental-settlement-details.use-case';
import { GetRentalsQuery, IGetRentalsQuery } from '~modules/crm/application/use-cases/get-rentals.use-case';
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
import { CallMapper } from '~modules/crm/domain/mappers/call.mapper';
import { ClientMapper } from '~modules/crm/domain/mappers/client.mapper';
import { RentalMapper } from '~modules/crm/domain/mappers/rental.mapper';
import { AccommodationsController } from '~modules/crm/infrastructure/http/controllers/accommodations.controller';
import { ClientsController } from '~modules/crm/infrastructure/http/controllers/clients.controller';
import { RentalsController } from '~modules/crm/infrastructure/http/controllers/rentals.controller';

@Module({
  imports: [],
  controllers: [ClientsController, RentalsController, AccommodationsController],
  providers: [
    ClientMapper,
    RentalMapper,
    CallMapper,
    { provide: IGetClientByIdQuery, useClass: GetClientByIdQuery },
    { provide: IFindClientByPhoneQuery, useClass: FindClientByPhoneQuery },
    { provide: ICreateClientUseCase, useClass: CreateClientUseCase },
    { provide: IUpdateClientNameUseCase, useClass: UpdateClientNameUseCase },
    { provide: IUpdateClientPreferredLanguageUseCase, useClass: UpdateClientPreferredLanguageUseCase },
    { provide: IUpdateClientPreferencesUseCase, useClass: UpdateClientPreferencesUseCase },
    { provide: IGetRentalsQuery, useClass: GetRentalsQuery },
    { provide: IGetRentalByIdQuery, useClass: GetRentalByIdQuery },
    { provide: IGetRentalSettlementDetailsQuery, useClass: GetRentalSettlementDetailsQuery },
    { provide: IGetRentalEmergencyDetailsQuery, useClass: GetRentalEmergencyDetailsQuery },
    { provide: IGetRentalAvailableDateSpansQuery, useClass: GetRentalAvailableDateSpansQuery },
    { provide: IGetCurrentClientAccommodationQuery, useClass: GetCurrentClientAccommodationQuery },
    { provide: ICreateBookingUseCase, useClass: CreateBookingUseCase },
    { provide: IConfirmSettlementUseCase, useClass: ConfirmSettlementUseCase },
    { provide: ICreateCallUseCase, useClass: CreateCallUseCase },
  ],
  exports: [ICreateCallUseCase],
})
export class CrmModule {}
