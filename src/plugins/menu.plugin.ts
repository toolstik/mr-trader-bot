import { MenuMiddleware } from 'telegraf-inline-menu';
import { Injectable } from "@nestjs/common";
import Telegraf, { Stage, BaseScene } from 'telegraf';
import { BotPlugin } from '../types/bot-plugin';
import { MyContext } from '../types/my-context';
import { Keyboard, Key } from 'telegram-keyboard';
import { menu } from "../bot/menu";

// main
// 	add Ticker
// 		select ticker
// 	remove Ticker
// 		select ticker
// 	add list
// 		select list
// 	remove list
// 		select list
// 	test ticker
// 		select 1 ticker
// 	list
// 	settings
// 		set donchian depth


function button(title: string, data: string) {
	return Key.callback(title, data);
}

const mainMenuKeyboard = Keyboard.make([
	[button('Button T 1', 'button1'), button('Button T 2', 'button2')],
]);

const mainMenuScene = new BaseScene<MyContext>('main-menu');
mainMenuScene.enter(async ctx => {
	await ctx.reply('Welcome to main menu');
});
mainMenuScene.on('callback_query', async ctx => {
	await ctx.answerCbQuery(`${ctx.callbackQuery.data} pressed`);
});

const x = new Stage<MyContext>([]);

@Injectable()
export class MenuPlugin implements BotPlugin {

	register(bot: Telegraf<MyContext>) {

		const menuMiddleware = new MenuMiddleware('/', menu);
		bot.use(menuMiddleware.middleware());
		bot.command('menu', async ctx => menuMiddleware.replyToContext(ctx));

		// bot.command('menu', async ctx => {
		// 	await ctx.reply('Welcome', mainMenuKeyboard.inline());
		// });

		// bot.on('callback_query', async ctx => {
		// 	await ctx.reply('callback');
		// 	return await ctx.answerCbQuery(`${ctx.callbackQuery.data} pressed`);
		// });

		// bot.use()
	}

}
