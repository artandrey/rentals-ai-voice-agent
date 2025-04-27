import { Inject } from '@nestjs/common';
import { Telegraf } from 'telegraf';

import { IAppConfigService } from '~shared/application/services/app-config-service.interface';
import { BaseToken } from '~shared/constants';

export class BotService extends Telegraf {
  constructor(@Inject(BaseToken.APP_CONFIG) config: IAppConfigService) {
    super(config.get('TELEGRAM_BOT_TOKEN'));
  }

  async onApplicationBootstrap() {
    this.launch().catch((err) => {
      console.error(err);
    });
  }
}
