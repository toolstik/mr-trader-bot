import { downloadSymbolHistory, updateHistory } from './main';

void (async () => {
  // console.log(symbols.length, symbols);
  // const data = historyData();
  // const aapl = data['AAPL'];
  // console.log(aapl);

  await downloadSymbolHistory();
  updateHistory();
})();
