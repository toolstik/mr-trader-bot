/* eslint-disable @typescript-eslint/no-var-requires */
/*
1. +get snp list
2. get history for every symbol
3. get transitions
4. build report
*/

import * as fs from 'fs';
import * as path from 'path';

import { SnP500ListItem } from '../../src/modules/datahub/datahub.service';
import { YahooService } from '../../src/modules/yahoo/yahoo.service';
import { MarketHistory } from '../../src/types/history';
import { plainToRecord } from '../../src/utils/record-transform';

const HISTORY_FILE_PATH = path.join(__dirname, 'history-data.json');

function snpData() {
  const result = require('./snp-list.json') as SnP500ListItem[];
  return result;
}

function historyData() {
  const result = require(HISTORY_FILE_PATH);
  return plainToRecord(MarketHistory, result);
}

async function downloadSymbolHistory(...symbols: string[]) {
  const yahoo = new YahooService();

  if (!symbols) {
    symbols = snpData()
      .map(i => i.Symbol)
      .sort();
  }

  const data = await yahoo.getHistoryDates(symbols, '2020-01-01');
  const stringData = JSON.stringify(data.result, null, 2);
  console.log('errors', data.errors);
  fs.writeFileSync(HISTORY_FILE_PATH, stringData);
  return data;
}

void (async () => {
  // console.log(symbols.length, symbols);
  const data = historyData();
  const aapl = data['AAPL'];
  console.log(aapl);
})();

// console.log(snpData()[0]);
