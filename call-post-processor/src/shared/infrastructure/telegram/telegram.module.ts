import { Global, Module } from '@nestjs/common';

import { BotService } from './telegraph/bot.service';

@Module({
  providers: [BotService],
  exports: [BotService],
})
export class TelegramModule {}
