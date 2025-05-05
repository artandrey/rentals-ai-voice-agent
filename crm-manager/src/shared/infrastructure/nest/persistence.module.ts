import { Global, Inject, Module, OnModuleInit } from '@nestjs/common';
import { client } from 'twenty-crm-api-client/client/client.gen';

import { IAppConfigService } from '~shared/application/services/app-config-service.interface';
import { BaseToken } from '~shared/constants';

import { TWENTY_CRM_CLIENT } from '../persistence/constants';
import { TwentyCrmDbContext } from '../persistence/twenty-crm/db-context/twenty-crm-db-context';
import { persistence } from './providers';

@Global()
@Module({
  imports: [],
  providers: [
    { provide: BaseToken.DB_CONTEXT, useClass: TwentyCrmDbContext },
    ...persistence,
    {
      provide: TWENTY_CRM_CLIENT,
      useValue: client,
    },
  ],
  exports: [BaseToken.DB_CONTEXT],
})
export class PersistenceModule implements OnModuleInit {
  constructor(@Inject(BaseToken.APP_CONFIG) private readonly appConfig: IAppConfigService) {}

  onModuleInit() {
    client.setConfig({
      baseURL: this.appConfig.get('TWENTY_API_URL'),
      headers: {
        Authorization: `Bearer ${this.appConfig.get('TWENTY_API_KEY')}`,
      },
    });
  }
}
