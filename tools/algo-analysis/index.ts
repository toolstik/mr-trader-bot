import { getAllSymbolsEvents, saveReport } from './main';

void (async () => {
  // console.log(symbols.length, symbols);
  // const data = historyData();
  // const aapl = data['AAPL'];
  // console.log(aapl);

  const data = await getAllSymbolsEvents();
  await saveReport(data);
})();
