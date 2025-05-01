import { Global, Module } from '@nestjs/common';

import { BaseToken } from '~shared/constants';

import { persistence } from './providers';
import { TwentyCrmDbContext } from './twenty-crm/db-context/twenty-crm-db-context';

@Global()
@Module({
  imports: [],
  providers: [{ provide: BaseToken.DB_CONTEXT, useClass: TwentyCrmDbContext }, ...persistence],
  exports: [BaseToken.DB_CONTEXT],
})
export class DatabaseModule {}
