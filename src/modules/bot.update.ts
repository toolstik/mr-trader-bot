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
      { command: 'add', description: 'Добавить тикер для отслеживания' },
      { command: 'list', description: 'Показать список тикеров в подписке' },
    ]);

    this.bot.catch(async (error: any, ctx: MyContext) => {
      this.log.error('telegraf error ocurred', error);
      await ctx.reply(`Error: \n${error}`);
    });
  }
}
