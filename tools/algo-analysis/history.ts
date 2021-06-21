import * as util from 'util';

import { historyData, updateHistory } from './main';

void (async () => {
  // console.log(symbols.length, symbols);
  const data = historyData();
  const aapl = data['AAPL'];
  const aaplExtended = updateHistory(aapl).slice(0, 20);
  console.log(util.inspect(aaplExtended, false, null, true /* enable colors */));

  // console.time('history download');
  // await downloadSymbolHistory();
  // console.timeEnd('history download');
  // console.time('history update');
  // updateHistory();
  // console.timeEnd('history update');
})();
