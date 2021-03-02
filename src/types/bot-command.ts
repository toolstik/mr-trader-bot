import { Injectable, Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';

import { BotPlugin } from './bot-plugin';
import { MyContext } from './my-context';
import _ = require('lodash');

@Injectable()
export abstract class BotCommand implements BotPlugin {
  constructor(private _$log: Logger) {}

  abstract alias(): string[];

  abstract description(): string;

  register(bot: Telegraf<MyContext>) {
    for (const a of this.alias()) {
      bot.command(a, async ctx => {
        const { text, command } = ctx.state.command;
        const timer = new Date();
        this._$log.debug(
          `Command '${text}' from '${
            ctx.session.username || ctx.session.chatId
          }' processing started`,
        );

        await this.process(ctx);

        this._$log.debug(
          `Command '${command}' processing finished in ${new Date().getTime() - timer.getTime()}ms`,
        );
      });
    }
  }

  protected abstract process(ctx: MyContext): Promise<void>;
}
