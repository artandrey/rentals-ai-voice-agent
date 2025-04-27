import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { RentalsService, client } from 'twenty-crm-api-client';

import { IAppConfigService } from '~shared/application/services/app-config-service.interface';
import { BaseToken } from '~shared/constants';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class CrmModule implements OnModuleInit {
  constructor(@Inject(BaseToken.APP_CONFIG) private readonly appConfig: IAppConfigService) {}

  onModuleInit() {
    client.setConfig({
      baseUrl: this.appConfig.get('TWENTY_API_URL'),
      headers: {
        Authorization: `Bearer ${this.appConfig.get('TWENTY_API_KEY')}`,
      },
    });
  }
}
