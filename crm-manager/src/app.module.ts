import { Module } from '@nestjs/common';

import { CrmModule } from '~modules/crm/infrastructure/nest/crm.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { PostProcessingModule } from './modules/post-processing/infrastructure/nest/post-processing.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [CoreModule, SharedModule, CrmModule, PostProcessingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
