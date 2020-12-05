import { Storage } from './storage';
import { existsSync, readFileSync } from 'fs';
import { I18n as TelegrafI18n } from '@edjopato/telegraf-i18n';
import { MenuMiddleware } from 'telegraf-inline-menu';
import { Telegraf } from 'telegraf';
import * as admin from 'firebase-admin';
import * as TelegrafSessionFirebase from 'telegraf-session-firebase'

import { MyContext } from './my-context';
import { menu } from './menu';

admin.initializeApp();

const tokenFilePath = existsSync('/run/secrets') ? '/run/secrets/bot-token.txt' : 'bot-token.txt';
const token = readFileSync(tokenFilePath, 'utf8').trim();
const bot = new Telegraf<MyContext>(token);


const i18n = new TelegrafI18n({
	directory: 'locales',
	defaultLanguage: 'en',
	defaultLanguageOnMissing: true,
	useSession: true,
});
bot.use(i18n.middleware());

const database = admin.database();
const databaseSession = TelegrafSessionFirebase(database.ref('sessions'));
bot.use(databaseSession);
bot.on('text', (ctx, next) => {
	ctx.session = {
		...ctx.session,
		username: ctx.chat.username,
		chatId: ctx.chat.id,
		enabled: ctx.session?.enabled ?? true,
		subscriptionTickers: ctx.session?.subscriptionTickers ?? [],
	};
	return next()
})


bot.command('getid', async context => {
	const testRef = database.ref('session');
	// console.log(context.session);
	// console.log(testRef.toString());
	// await testRef.child("key1").set("value");
	// context.session.subscriptionTickers.push("AAPL");
	const storage = new Storage(database)
	await storage.updateTickersHistory(20);
	console.log(await storage.getTickerData('AAPL'));
	await context.reply(`${context.chat.id}`);
});

const menuMiddleware = new MenuMiddleware('/', menu);
bot.command('start', async context => menuMiddleware.replyToContext(context));
bot.command('settings', async context => menuMiddleware.replyToContext(context, '/settings/'));
bot.use(menuMiddleware.middleware());

// TODO: wait for release of telegraf 3.39. Then the bot.catch is properly typed in TypeScript
// Merged but not released yet: https://github.com/telegraf/telegraf/pull/1015
bot.catch((error: any) => {
	console.error('telegraf error occured', error);
});

export const BOT = bot;

export async function start() {
	// The commands you set here will be shown as /commands like /start or /magic in your telegram client.
	await bot.telegram.setMyCommands([
		{ command: 'start', description: 'open the menu' },
		{ command: 'help', description: 'show the help' },
		{ command: 'settings', description: 'open the settings' },
	]);

	await bot.launch();
	console.log(new Date(), 'Bot started as', bot.options.username);
}
