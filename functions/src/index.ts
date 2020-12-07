import { MyContext } from '../../src/types/my-context';
import { Telegraf } from 'telegraf';
import * as functions from 'firebase-functions';
import { start } from '../../src';

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript


let bot: Telegraf<MyContext>;

async function main() {

	const b = await start();
	bot = b;
	await b.launch();
}

void main();

exports.bot = functions.https.onRequest(async (req, res) => {
	await bot.handleUpdate(req.body, res);
});

exports.scheduler = functions.pubsub.schedule('* * * * *')
	.onRun(async () => {
		await bot.telegram.sendMessage(259957285, `${new Date()}`);
	});
