import { Injectable } from "@nestjs/common";
import { Composer, Telegraf } from 'telegraf';
import { BotPlugin } from '../types/bot-plugin';
import { MyContext } from '../types/my-context';

const regex = /^\/([^@\s]+)@?(?:(\S+)|)\s?([\s\S]*)$/i;

/* eslint no-param-reassign: ["error", { "props": false }] */
const commandParts = () => Composer.on('text', (ctx, next) => {
	const parts = regex.exec(ctx.message.text);
	if (!parts) return next();
	const command = {
		text: ctx.message.text,
		command: parts[1],
		bot: parts[2],
		args: parts[3],
		splitArgs: parts[3].split(/\s+/),
	};
	ctx.state.command = command;
	return next();
});

@Injectable()
export class CommandArgsPlugin implements BotPlugin {

	register(bot: Telegraf<MyContext>) {
		bot.use(commandParts());
	}

}
