import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';

import { NotificationService } from '../../modules/notification/notification.service';
import { BotPlugin } from '../../types/bot-plugin';
import { MyContext } from '../../types/my-context';

@Injectable()
export class NotifyCommand implements BotPlugin {
  constructor(private notificationService: NotificationService) {}

  register(bot: Telegraf<MyContext>) {
    bot.command('notify', async ctx => {
      const data = await this.notificationService.sendAssetStatusChangesAll();
      await ctx.reply(`Собраны данные по ${Object.keys(data.statuses).length} активам.
			Отправлено ${data.notifications.length} уведомлений`);
    });

    bot.command('status', async ctx => {
      await this.notificationService.sendAssetStatusStateAllPages();
    });
  }
}
