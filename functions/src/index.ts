import * as functions from 'firebase-functions';
import { start } from '../../src';

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

type ExportObject = ReturnType<typeof start> extends Promise<infer R> ? R : never;

let values: ExportObject;

async function main() {
	values = await start();
	await values.bot.launch();
}

void main();

exports.bot = functions.https.onRequest(async (req, res) => {
	await values.bot.handleUpdate(req.body, res);
});

exports.updateHistoryScheduler = functions.pubsub.schedule('0 */4 * * *')
	.onRun(async () => {
		await values.updateHistory();
	});

exports.notificationScheduler = functions.pubsub.schedule('*/5 * * * *')
	.onRun(async () => {
		await values.notify();
	});

exports.fundamentalsScheduler = functions.pubsub.schedule('5 11 * * *')
	.timeZone('Europe/Moscow')
	.onRun(async () => {
		await values.fundamentals();
	});

