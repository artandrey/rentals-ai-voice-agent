import { Module } from '@nestjs/common';

import { ShoppingModule } from '~modules/shopping/infrastructure/nest/shopping.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { SessionsModule } from './modules/sessions/infrastructure/nest/sessions.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [CoreModule, SharedModule, SessionsModule, ShoppingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
