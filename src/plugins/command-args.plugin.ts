import { Injectable } from "@nestjs/common";
import { Telegraf } from 'telegraf';
import * as commandParts from 'telegraf-command-parts';
import { BotPlugin } from '../types/bot-plugin';
import { MyContext } from '../types/my-context';


@Injectable()
export class CommandArgsPlugin implements BotPlugin {

	register(bot: Telegraf<MyContext>) {
		bot.use(commandParts());
	}

}
