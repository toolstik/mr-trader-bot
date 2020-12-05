import Telegraf from 'telegraf';
import { MenuMiddleware, MenuTemplate } from 'telegraf-inline-menu';
import { MyContext } from '../my-context';
import { menu as settingsMenu } from './settings';
import TelegrafStatelessQuestion from 'telegraf-stateless-question';

export const menu = new MenuTemplate<MyContext>(context => context.i18n.t('welcome'));

const newTickerQuestion = new TelegrafStatelessQuestion('add_ticker', async ctx => {
	console.log(`####User said: ${ctx.message.text}`);
	await ctx.deleteMessage(ctx.message.message_id);
	if (ctx.message.reply_to_message) {
		await ctx.deleteMessage(ctx.message.reply_to_message.message_id);
	}


});



// menu.url('Telegram API Documentation', 'https://core.telegram.org/bots/api');
// menu.url('Telegraf Documentation', 'https://telegraf.js.org/');
// menu.url('Inline Menu Documentation', 'https://github.com/EdJoPaTo/telegraf-inline-menu');
menu.interact('Add Ticker', 'add_ticker', {
	do: async ctx => {
		const msg = await newTickerQuestion.replyWithMarkdown(ctx, 'Ticker code:');
		return false;
	},
})


menu.submenu(context => '⚙️' + context.i18n.t('menu.settings'), 'settings', settingsMenu);



export function setupMenu(bot: Telegraf<MyContext>) {

	bot.use(newTickerQuestion.middleware());

	const menuMiddleware = new MenuMiddleware('/', menu);
	bot.command('start', async context => menuMiddleware.replyToContext(context));
	bot.command('settings', async context => menuMiddleware.replyToContext(context, '/settings/'));
	bot.use(menuMiddleware.middleware());

}
