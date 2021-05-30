// Access the workerData by requiring it.
import { parentPort } from 'worker_threads';

import { assetRun } from './main';

// Main thread will pass the data you need
// through this event listener.
parentPort.on('message', (param: string) => {
  if (typeof param !== 'string') {
    throw new Error('param must be a string.');
  }
  const result = assetRun(param);

  // Access the workerData.
  // console.log(`workerData is`, workerData);

  // return the result to main thread.
  parentPort.postMessage(result);
});
