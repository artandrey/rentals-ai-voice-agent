import { ConfigurableModuleBuilder, DynamicModule, Module } from '@nestjs/common';

import { SQLITE_DB } from './constants';
import { DrizzleSqliteService } from './services/drizzle-sqlite/drizzle-sqlite.service';
import { IDrizzleSqliteModuleOptions } from './types/drizzle-sqlite-module-options.interface';
import { IWithProviderToken } from './with-provider-token.interface';

const { ConfigurableModuleClass, ASYNC_OPTIONS_TYPE, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<IDrizzleSqliteModuleOptions>()
    .setClassMethodName('register')
    .setExtras({ isGlobal: true }, (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }))
    .build();

type Options = typeof OPTIONS_TYPE & IWithProviderToken;
type AsyncOptions = typeof ASYNC_OPTIONS_TYPE & IWithProviderToken;

@Module({})
export class DrizzleSqliteModule extends ConfigurableModuleClass {
  public static register(options: Options): DynamicModule {
    const { providers = [], exports = [], ...other } = super.register(options);
    const injectionToken = options.provideAs ?? SQLITE_DB;
    return {
      providers: [
        ...providers,
        DrizzleSqliteService,
        {
          provide: injectionToken,
          useFactory: async (drizzleService: DrizzleSqliteService) => {
            return drizzleService.getDrizzle(options.db, options.schema);
          },
          inject: [DrizzleSqliteService],
        },
      ],
      exports: [...exports, injectionToken],
      ...other,
    };
  }

  public static registerAsync(options: AsyncOptions): DynamicModule {
    const { providers = [], exports = [], ...other } = super.registerAsync(options);
    const injectionToken = options.provideAs ?? SQLITE_DB;

    return {
      providers: [
        ...providers,
        DrizzleSqliteService,
        {
          provide: injectionToken,
          useFactory: async (drizzleService: DrizzleSqliteService, options: IDrizzleSqliteModuleOptions) => {
            return drizzleService.getDrizzle(options.db, options.schema);
          },
          inject: [DrizzleSqliteService, MODULE_OPTIONS_TOKEN],
        },
      ],
      exports: [...exports, injectionToken],
      ...other,
    };
  }
}
