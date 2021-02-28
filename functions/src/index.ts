import * as functions from 'firebase-functions';

import { start } from '../../src';

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

// type StartResult = ReturnType<typeof start> extends Promise<infer R> ? R : never;

const DEFAULT_OPTIONS: functions.RuntimeOptions = {
  memory: '1GB',
  timeoutSeconds: 180,
};

async function main() {
  const result = await start();
  console.info('-------------Initialization complete--------------');
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

// if (FUNCTION_TARGET === 'bot') {
//   void (async function () {
//     const values = await exportPromise;
//   })();
// }

exports.test = functions
  .runWith({
    ...DEFAULT_OPTIONS,
  })
  .https.onRequest(async (req, res) => {
    res.send(`Current time is: ${new Date()}`);
  });

exports.bot = functions
  .runWith({
    ...DEFAULT_OPTIONS,
  })
  .https.onRequest(async (req, res) => {
    const values = await exportPromise;
    try {
      console.debug('--------Request received-------');
      await values.bot.handleUpdate(req.body, res);
      res.send();
    } catch (e) {
      console.error(e);
      res.status(500).send(e);
    }
  });

// exports.updateHistoryScheduler = functions
// 	.runWith({
// 		...DEFAULT_OPTIONS,
// 	})
// 	.pubsub
// 	.schedule('0 */4 * * *')
// 	.onRun(async () => {
// 		const values = await exportPromise;
// 		await values.updateHistory();
// 	});

// exports.notificationScheduler = functions
// 	.runWith({
// 		...DEFAULT_OPTIONS,
// 	})
// 	.pubsub
// 	.schedule('*/5 * * * *')
// 	.onRun(async () => {
// 		const values = await exportPromise;
// 		await values.notify();
// 	});

// exports.fundamentalsScheduler = functions.pubsub.schedule('5 11 * * *')
// 	.timeZone('Europe/Moscow')
// 	.onRun(async () => {
// const values = await startPromise;
// 		await values.fundamentals();
// 	});

// exports.statusScheduler = functions
// 	.runWith({
// 		...DEFAULT_OPTIONS,
// 	})
// 	.pubsub
// 	.schedule('5 11 * * *')
// 	.timeZone('Europe/Moscow')
// 	.onRun(async () => {
// 		const values = await exportPromise;
// 		await values.status();
// 	});
