import { Telegraf } from 'telegraf';

import { MyContext } from './my-context';

export interface BotPlugin {
  register(bot: Telegraf<MyContext>);
}
