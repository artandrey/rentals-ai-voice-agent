import { Global, Module } from '@nestjs/common';

import { IAppConfigService } from '~shared/application/services/app-config-service.interface';
import { BaseToken } from '~shared/constants';

import { DrizzleSqliteModule } from 'src/lib/drizzle-sqlite';

import { DrizzleDbContext } from './drizzle/db-context/drizzle-db-context';
import { mergeDbdSchema } from './drizzle/schema/merged-schema';
import { persistence } from './providers';

@Global()
@Module({
  imports: [
    DrizzleSqliteModule.registerAsync({
      useFactory: (appConfig: IAppConfigService) => ({
        db: {
          url: appConfig.get('DB_URL'),
        },
        schema: mergeDbdSchema,
      }),
      inject: [BaseToken.APP_CONFIG],
    }),
  ],
  providers: [{ provide: BaseToken.DB_CONTEXT, useClass: DrizzleDbContext }, ...persistence],
  exports: [BaseToken.DB_CONTEXT],
})
export class DatabaseModule {}
