import { Injectable } from "@nestjs/common";
import Telegraf from 'telegraf';
import { BotPlugin } from "../../types/bot-plugin";
import { MyContext } from "../../types/my-context";
import _ = require("lodash");

@Injectable()
export abstract class BaseCommand implements BotPlugin {

	abstract alias(): string | string[];

	register(bot: Telegraf<MyContext>) {

		const aliases = _.flattenDeep([this.alias()]);

		for (const a of aliases) {
			bot.command(a, async ctx => {
				await this.process(ctx);
			})
		}
	}

	protected abstract async process(ctx: MyContext): Promise<void>;

}
