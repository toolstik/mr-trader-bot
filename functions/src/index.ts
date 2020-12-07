import * as functions from 'firebase-functions';
import { start } from '../../src';

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript


async function main() {

	const { bot, updateHistory, notify } = await start();
	await bot.launch();

	exports.bot = functions.https.onRequest(async (req, res) => {
		await bot.handleUpdate(req.body, res);
	});

	exports.updateHistoryScheduler = functions.pubsub.schedule('0 0/4 * * *')
		.onRun(async () => {
			await updateHistory();
		});

	exports.updateHistoryScheduler = functions.pubsub.schedule('0/5 * * * *')
		.onRun(async () => {
			await notify();
		});
}

void main();


