import { MyContext } from './my-context';
import { Telegraf } from 'telegraf';

export interface BotPlugin {
	register(bot: Telegraf<MyContext>);
}
