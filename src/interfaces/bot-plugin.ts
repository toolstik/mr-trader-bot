import { MyContext } from './../bot/my-context';
import { Telegraf } from 'telegraf';

export interface BotPlugin {
	register(bot: Telegraf<MyContext>);
}
