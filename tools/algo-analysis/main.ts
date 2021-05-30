/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/no-var-requires */
/*
1. +get snp list
2. +get history for every symbol
3. get transitions
4. build report
*/

import * as fs from 'fs';
import _ = require('lodash');
import { Column, Workbook } from 'exceljs';
import { flattenDeep } from 'lodash';
import { StaticPool } from 'node-worker-threads-pool';
import * as path from 'path';

import { AssetStatusChangedEvent } from '../../src/events/asset-status-changed.event';
import {
  compareMarketHistoryAsc,
  compareMarketHistoryDesc,
  donchianFunc,
  fsmDeepTransition,
} from '../../src/modules/analysis/analysis.service';
import { AssetEntity } from '../../src/modules/asset/asset.entity';
import { SnP500ListItem } from '../../src/modules/datahub/datahub.service';
import { YahooService } from '../../src/modules/yahoo/yahoo.service';
import { MarketHistory, MultipleHistory } from '../../src/types/history';
import { MarketData } from '../../src/types/market-data';
import { plainToRecord } from '../../src/utils/record-transform';

const HISTORY_FILE_PATH = path.join(__dirname, 'history-data.json');

const PARAMETERS = {
  donchianOuter: 20,
  donchianInner: 5,
  historyDateFrom: '2020-01-01',
};

function snpData() {
  const result = require('./snp-list.json') as SnP500ListItem[];
  return result;
}

function snpSymbols() {
  return snpData()
    .map(i => i.Symbol)
    .sort();
}

function historyData() {
  let result = require(HISTORY_FILE_PATH);
  result = plainToRecord(MarketHistory, result);
  return result as MultipleHistory;
}

async function downloadSymbolHistory(...symbols: string[]) {
  const yahoo = new YahooService();

  if (!symbols) {
    symbols = snpSymbols();
  }

  const data = await yahoo.getHistoryDates(symbols, PARAMETERS.historyDateFrom);
  const stringData = JSON.stringify(data.result, null, 2);
  console.log('errors', data.errors);
  fs.writeFileSync(HISTORY_FILE_PATH, stringData);
  return data;
}

type TransitionResult = {
  asset: AssetEntity;
  event: AssetStatusChangedEvent;
  historyState: MarketHistory;
  marketData: MarketData;
};
type ReportData = TransitionResult & {
  oldMarketData: MarketData;
  minPrice: number;
  maxPrice: number;
};
function assetRun(symbol: string) {
  const assetHistory = historyData()[symbol]?.sort(compareMarketHistoryDesc);

  if (!assetHistory) {
    return [];
  }

  let assetState = {
    symbol,
    state: 'NONE',
    stateData: null,
  } as AssetEntity;

  let transitionMinPrice: number = null;
  let transitionMaxPrice: number = null;
  let prevMarketData: MarketData = null;

  const donchian = (date: Date, daysBack: number) => {
    const value = donchianFunc(assetHistory, date, daysBack);

    // if (!value) {
    //   console.log(
    //     symbol,
    //     date.toISOString(),
    //     `${PARAMETERS.donchianOuter}-days donchian can not be determined`,
    //   );
    // }

    return value;
  };

  const transition: (hist: MarketHistory) => TransitionResult = (historyEntry: MarketHistory) => {
    const defaultResult: TransitionResult = {
      asset: assetState,
      event: null,
      marketData: null,
      historyState: historyEntry,
    };

    const donchianOuter = donchian(historyEntry.date, PARAMETERS.donchianOuter);

    if (!donchianOuter) {
      return defaultResult;
    }

    const donchianInner = donchian(historyEntry.date, PARAMETERS.donchianInner);

    if (!donchianInner) {
      return defaultResult;
    }

    const marketDataHigh = {
      date: historyEntry.date,
      price: historyEntry.high,
      donchianOuter: donchianOuter,
      donchianInner: donchianInner,
    } as MarketData;

    const stateHigh = fsmDeepTransition(assetState, marketDataHigh);

    if (stateHigh.events?.length) {
      return {
        asset: stateHigh.asset,
        event: stateHigh.events[0],
        marketData: marketDataHigh,
        historyState: historyEntry,
      };
    }

    const marketDataLow = {
      date: historyEntry.date,
      price: historyEntry.low,
      donchianOuter: donchianOuter,
      donchianInner: donchianInner,
    } as MarketData;

    const stateLow = fsmDeepTransition(assetState, marketDataLow);

    if (stateLow.events?.length) {
      return {
        asset: stateLow.asset,
        event: stateLow.events[0],
        marketData: marketDataLow,
        historyState: historyEntry,
      };
    }

    return defaultResult;
  };

  return _(assetHistory)
    .sort(compareMarketHistoryAsc)
    .flatMap(historyEntry => {
      const transitionResult = transition(historyEntry) as ReportData;

      transitionMinPrice =
        transitionMinPrice == null
          ? transitionResult.historyState.low
          : Math.min(transitionMinPrice, transitionResult.historyState.low);
      transitionMaxPrice =
        transitionMaxPrice == null
          ? transitionResult.historyState.high
          : Math.max(transitionMaxPrice, transitionResult.historyState.high);

      if (!transitionResult?.event) {
        return [];
      }

      assetState = transitionResult.asset;

      transitionResult.minPrice = transitionMinPrice;
      transitionResult.maxPrice = transitionMaxPrice;
      transitionResult.oldMarketData = prevMarketData;

      transitionMinPrice = transitionResult.historyState.low;
      transitionMaxPrice = transitionResult.historyState.high;
      prevMarketData = transitionResult.marketData;

      return [transitionResult];
    })
    .value();

  // for (const historyEntry of assetHistory.sort(compareMarketHistoryAsc)) {
  //   const transitionResult = transition(historyEntry);

  //   if (!transitionResult) {
  //     continue;
  //   }

  //   assetState = transitionResult.asset;

  //   // console.log(symbol, historyEntry.date.toISOString(), transitionResult.events);
  // }
}

async function getAllSymbolsEvents() {
  const staticPool = new StaticPool({
    size: 10,
    task(symbol: string) {
      return assetRun(symbol);
    },
  });

  const symbols = snpSymbols();
  const symbolsLeft = new Set(symbols);

  const unflattenResult = await Promise.all(
    symbols.map(async symbol => {
      const data = await staticPool.exec(symbol);
      symbolsLeft.delete(symbol);
      console.log(
        `(${symbols.length - symbolsLeft.size}/${symbols.length}) ${symbol} - ${
          data.length
        } events`,
      );
      return data;
    }),
  );

  return flattenDeep(unflattenResult);
}

async function saveReport(events: ReportData[]) {
  const isExit = (i: ReportData) =>
    i.event.to === 'NONE' && (i.event.from === 'REACH_TOP' || i.event.from === 'REACH_BOTTOM');

  // const isEnter = (i: AssetStatusChangedEvent) => i.to === 'REACH_TOP' || i.to === 'REACH_BOTTOM';

  const data2 = events.filter(isExit).map(i => {
    return {
      // Id: i.id,
      Symbol: i.event.symbol,
      'Enter Status': i.event.from,
      'Enter Date': i.event.oldPriceDate,
      'Enter Price': i.event.oldPrice,
      'Enter STOP Price':
        i.event.from === 'REACH_TOP'
          ? i.oldMarketData?.donchianInner.minValue
          : i.oldMarketData?.donchianInner.maxValue,
      'Exit Price': i.event.currentPrice,
      'Exit Date': i.event.currentPriceDate,
      'Min Price': i.minPrice,
      'Max Price': i.maxPrice,
    };
  });

  const wb = new Workbook();
  const ws = wb.addWorksheet();

  ws.columns = Object.keys(data2[0]).map(k => {
    return { key: k, header: k } as Column;
  });

  data2.forEach(i => {
    ws.addRow(i);
  });

  const reportPath = path.join(__dirname, 'report.xlsx');

  await wb.xlsx.writeFile(reportPath);

  // console.log(data2);

  console.log('finish');
}

void (async () => {
  // console.log(symbols.length, symbols);
  // const data = historyData();
  // const aapl = data['AAPL'];
  // console.log(aapl);

  const data = await getAllSymbolsEvents();
  await saveReport(data);
})();

// console.log(snpData()[0]);
