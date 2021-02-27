import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';

import { ConfigService } from '../modules/global/config.service';
import { BotPlugin } from '../types/bot-plugin';
import { MyContext } from '../types/my-context';

@Injectable()
export class BotService {
  readonly bot: Telegraf<MyContext>;

  constructor(private configService: ConfigService) {
    const { bot_token } = this.configService.getEnv();
    this.bot = new Telegraf<MyContext>(bot_token);
  }

  private registerPlugins(plugins: BotPlugin[]) {
    for (const plugin of plugins) {
      plugin.register(this.bot);
    }
  }

  private async configure() {
    await this.bot.telegram.setMyCommands([
      { command: 'add', description: 'Добавить тикер для отслеживания' },
      { command: 'list', description: 'Показать список тикеров в подписке' },
    ]);
  }

  createBot(plugins?: BotPlugin[]) {
    this.bot.catch(async (error: any, ctx: MyContext) => {
      console.error('telegraf error ocurred', error);
      await ctx.reply(`Error: \n${error}`);
    });

    this.bot.start(async ctx => {
      await this.configure();
    });

    if (plugins) {
      this.registerPlugins(plugins);
    }

    // await this.configure();

    return this.bot;
  }
}
