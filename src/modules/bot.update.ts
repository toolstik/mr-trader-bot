import { InjectBot, Start, Update } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

import { MyContext } from '../types/my-context';

@Update()
export class BotUpdate {
  @Start()
  async onStart(@InjectBot() bot: Telegraf<MyContext>) {
    await bot.telegram.setMyCommands([
      { command: 'add', description: 'Добавить тикер для отслеживания' },
      { command: 'list', description: 'Показать список тикеров в подписке' },
    ]);

    bot.catch(async (error: any, ctx: MyContext) => {
      console.error('telegraf error ocurred', error);
      await ctx.reply(`Error: \n${error}`);
    });
  }
}
