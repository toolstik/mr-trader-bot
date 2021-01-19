import * as functions from 'firebase-functions';
import { start } from '../../src';

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

// type StartResult = ReturnType<typeof start> extends Promise<infer R> ? R : never;

async function main() {
	const result = await start();
	// await result.bot.launch();
	return result;
}

const exportPromise = main();

const { FUNCTION_TARGET, FUNCTIONS_EMULATOR } = process.env;

// start long-pooling if in emulator mode
if (FUNCTIONS_EMULATOR === 'true') {
	void (async () => {
		const values = await exportPromise;
		console.log('Start long-pooling...');
		await values.bot.launch();
	})();
}

// if(FUNCTION_TARGET === 'bot'){
// 	void (async function(){
// 		const values = await exportPromise;
// 	})();
// }

exports.bot = functions.https.onRequest(async (req, res) => {
	const values = await exportPromise;
	await values.bot.handleUpdate(req.body, res);
	res.send();
});

exports.updateHistoryScheduler = functions.pubsub.schedule('0 */4 * * *')
	.onRun(async () => {
		const values = await exportPromise;
		await values.updateHistory();
	});

exports.notificationScheduler = functions.pubsub.schedule('*/5 * * * *')
	.onRun(async () => {
		const values = await exportPromise;
		await values.notify();
	});

// exports.fundamentalsScheduler = functions.pubsub.schedule('5 11 * * *')
// 	.timeZone('Europe/Moscow')
// 	.onRun(async () => {
// const values = await startPromise;
// 		await values.fundamentals();
// 	});

exports.statusScheduler = functions.pubsub.schedule('5 11 * * *')
	.timeZone('Europe/Moscow')
	.onRun(async () => {
		const values = await exportPromise;
		await values.status();
	});

