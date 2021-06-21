import { downloadSymbolHistory, updateHistory } from './main';

void (async () => {
  // console.log(symbols.length, symbols);
  // const data = historyData();
  // const aapl = data['AAPL'];
  // console.log(aapl);


  console.time('history download');
  await downloadSymbolHistory(['AAPL'], '2021-01-01');
  console.timeEnd('history download');
  console.time('history update');
  updateHistory();
  console.timeEnd('history update');
})();
