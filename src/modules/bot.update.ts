import { OnModuleInit } from '@nestjs/common';
import { InjectBot, Update } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

import { MyContext } from '../types/my-context';
import { PlainLogger } from './global/plain-logger';

@Update()
export class BotUpdate implements OnModuleInit {
  constructor(@InjectBot() private bot: Telegraf<MyContext>, private log: PlainLogger) {}

  async onModuleInit() {
    await this.bot.telegram.setMyCommands([
      { command: 'help', description: 'Описание доступных команд' },
      { command: 'list', description: 'Показать список тикеров в подписке' },
      { command: 'stat', description: 'Показать статистику сигналов' },
    ]);

    // this.bot.use(async (ctx, next) => {
    //   console.log('###update', ctx.update);
    //   await next();
    // });

    this.bot.catch(async (error: any, ctx: MyContext) => {
      this.log.error('telegraf error ocurred', error);
      await ctx.reply(`Error: \n${error}`);
    });
  }
}
