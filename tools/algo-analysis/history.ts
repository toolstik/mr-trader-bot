import * as util from 'util';

import { downloadSymbolHistory, historyData, updateHistory } from './main';
import { customSymbols1plus2 } from './symbols';

void (async () => {
  // console.log(symbols.length, symbols);
  // const data = historyData();
  // const aapl = data['AAPL'];
  // const aaplExtended = updateHistory(aapl).slice(20, 40);
  // console.log(util.inspect(aaplExtended, false, null, true /* enable colors */));

  console.time('history download');
  await downloadSymbolHistory(customSymbols1plus2());
  console.timeEnd('history download');
  // console.time('history update');
  // updateHistory();
  // console.timeEnd('history update');
})();
