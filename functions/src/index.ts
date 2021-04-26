import d from 'debug';
import * as functions from 'firebase-functions';

import { start } from '../../src';

const debug = d('trader_bot:main');
// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

// type StartResult = ReturnType<typeof start> extends Promise<infer R> ? R : never;

const DEFAULT_OPTIONS: functions.RuntimeOptions = {
  memory: '1GB',
  timeoutSeconds: 9 * 60, //540 is max,
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
    debug('Start long-pooling...');
    await values.bot.launch();
  })();
} else {
  void (async () => {
    const values = await exportPromise;
    debug(`Set webhook to '${values.env.webhook_url}'...`);
    await values.bot.telegram.setWebhook(values.env.webhook_url);
  })();
}

// if (FUNCTION_TARGET === 'bot') {
//   void (async function () {
//     const values = await exportPromise;
//   })();
// }

// exports.test = functions
//   .runWith({
//     ...DEFAULT_OPTIONS,
//   })
//   .https.onRequest(async (req, res) => {
//     res.send(`Current time is: ${new Date()}`);
//   });

exports.bot = functions
  .runWith({
    ...DEFAULT_OPTIONS,
  })
  .https.onRequest(async (req, res) => {
    const values = await exportPromise;
    try {
      debug('--------Request received-------');
      await values.bot.handleUpdate(req.body, res).catch(e => {
        values.log.error('Handle update error', e);
      });
      debug('--------Update handled-------');
      // res.send();
    } catch (e) {
      values.log.error('Request processing error', e);
      // res.status(500).send(e);
    } finally {
      res.status(200).end();
    }
  });

exports.updateHistoryScheduler = functions
  .runWith({
    ...DEFAULT_OPTIONS,
  })
  .pubsub.schedule('2 */4 * * *')
  .onRun(async () => {
    const values = await exportPromise;
    await values.updateHistory();
  });

exports.notificationScheduler = functions
  .runWith({
    ...DEFAULT_OPTIONS,
    timeoutSeconds: 4 * 60,
  })
  .pubsub.schedule('*/5 * * * *')
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

exports.statusScheduler = functions
  .runWith({
    ...DEFAULT_OPTIONS,
  })
  .pubsub.schedule('5 11 * * MON,TUE,WED,THU,FRI')
  .timeZone('Europe/Moscow')
  .onRun(async () => {
    const values = await exportPromise;
    await values.status();
  });
