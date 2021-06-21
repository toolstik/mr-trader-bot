/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/no-var-requires */

import * as fs from 'fs';
import _ = require('lodash');
import { Column, Workbook } from 'exceljs';
import { flattenDeep } from 'lodash';
import { StaticPool } from 'node-worker-threads-pool-ts';
import * as path from 'path';
import { rsi, sma } from 'technicalindicators';

import { AssetStatusChangedEvent } from '../../src/events/asset-status-changed.event';
import {
  compareMarketHistoryAsc,
  compareMarketHistoryDesc,
  donchianFunc,
  fsmDeepTransition,
} from '../../src/modules/analysis/analysis.service';
import { AssetEntity } from '../../src/modules/asset/asset.entity';
import { recordMap } from '../../src/modules/commands/utils';
import { SnP500ListItem } from '../../src/modules/datahub/datahub.service';
import { YahooService } from '../../src/modules/yahoo/yahoo.service';
import { AssetStateKey } from '../../src/types/commons';
import { MarketHistory } from '../../src/types/history';
import { MarketData } from '../../src/types/market-data';
import { plainToRecord } from '../../src/utils/record-transform';
import moment = require('moment');

const HISTORY_FILE_PATH = path.join(__dirname, 'history-data.json');

const PARAMETERS = {
  donchianOuter: 20,
  donchianInner: 5,
  historyDateFrom: '2015-01-01',
  reportDateFrom: '2016-01-01',
};

type MarketHistoryIndicators = {
  sma50: number;
  sma200: number;
  rsi2: number;
  rsi14: number;
};

class MarketHistoryExtended extends MarketHistory {
  // sma50: number;
  // sma200: number;
  indicators: MarketHistoryIndicators;
}

const isExit = (i: TransitionResult) =>
  i.event.to === 'NONE' && (i.event.from === 'REACH_TOP' || i.event.from === 'REACH_BOTTOM');

const isEnter = (i: TransitionResult) =>
  i.event.to === 'REACH_TOP' || i.event.to === 'REACH_BOTTOM';

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
  result = plainToRecord(MarketHistoryExtended, result);
  return result as Record<string, MarketHistoryExtended[]>;
}

type IndicatorId<T extends keyof Indicators = keyof Indicators> = T extends `${infer K}Indicator`
  ? K
  : never;
type IndicatorKey<T extends IndicatorId> = Extract<`${T}Indicator`, keyof Indicators>;
type IndicatorArgs<K extends IndicatorId> = Indicators[IndicatorKey<K>] extends (
  args: infer P,
) => any[]
  ? P
  : never;
type IndicatorResult<K extends IndicatorId> = Indicators[IndicatorKey<K>] extends (
  ...args: any[]
) => (infer R)[]
  ? R
  : never;
type IndicatorFunc<T extends IndicatorId> = (arg: IndicatorArgs<T>) => IndicatorResult<T>[];
// const f: IndicatorKey<'sma'>;

class Indicators {
  private readonly sortedCollection: MarketHistoryExtended[];

  constructor(inputCollection: MarketHistoryExtended[]) {
    this.sortedCollection = inputCollection.sort(compareMarketHistoryAsc);
  }

  smaIndicator(period: number): number[] {
    const values = this.sortedCollection.map(i => i.close);
    return [...Array(period - 1).fill(null), ...sma({ period, values })];
  }

  rsiIndicator(period: number): number[] {
    const values = this.sortedCollection.map(i => i.close);
    return [...Array(period).fill(null), ...rsi({ period, values })];
  }

  apply<K extends IndicatorId>(
    indicator: K,
    arg: IndicatorArgs<K>,
    func: (item: MarketHistoryExtended, val: IndicatorResult<K>) => void,
  ) {
    let indicatorFunc: IndicatorFunc<K> = this[`${indicator}Indicator`];
    indicatorFunc = indicatorFunc.bind(this);
    const resultArray = indicatorFunc(arg);

    this.sortedCollection.forEach((item, i) => {
      func(item, resultArray[i]);
    });
  }
}

export async function downloadSymbolHistory(symbols?: string[], dateFrom?: moment.MomentInput) {
  const yahoo = new YahooService();

  if (!symbols?.length) {
    symbols = snpSymbols();
    // exclude error symbols
    symbols = symbols
      .filter(i => !['ETFC', 'BRK.B', 'CXO', 'BF.B', 'MYL', 'NBL', 'TIF', 'CTL'].includes(i))
      .slice(400, 500);
  }

  const data = await yahoo.getHistoryDates(symbols, dateFrom ?? PARAMETERS.historyDateFrom);
  const stringData = JSON.stringify(data.result, null, 2);
  console.log('errors', data.errors);
  fs.writeFileSync(HISTORY_FILE_PATH, stringData);
  return data;
}

export function updateHistory() {
  const history = historyData();

  // const mySma = (index: number, periods: number, col: MarketHistoryExtended[]) => {
  //   if (index + 1 < periods) {
  //     return null;
  //   }

  //   const tail = _.slice(col, index + 1 - periods, index + 1);

  //   return tail.reduce((prev, cur) => prev + cur.close, 0) / (tail.length || 1);
  // };

  // const externalSma = (index: number, periods: number, col: MarketHistoryExtended[]) => {
  //   if (index + 1 < periods) {
  //     return null;
  //   }

  //   const tail = _.slice(col, index + 1 - periods, index + 1).map(i => i.close);

  //   return sma({ period: periods, values: tail })[0];
  // };

  // recordMap(history, assetHist => {
  //   assetHist.sort(compareMarketHistoryAsc).forEach((item, i, collection) => {
  //     item.indicators = {
  //       ...item.indicators,
  //       sma50: mySma(i, 50, collection),
  //       sma50_2: externalSma(i, 50, collection),
  //       sma200: mySma(i, 200, collection),
  //     };
  //   });
  // });

  recordMap(history, assetHist => {
    const indicators = new Indicators(assetHist);

    indicators.apply('sma', 50, (item, value) => {
      item.indicators = {
        ...item.indicators,
        sma50: value,
      };
    });

    indicators.apply('sma', 200, (item, value) => {
      item.indicators = {
        ...item.indicators,
        sma200: value,
      };
    });

    indicators.apply('rsi', 2, (item, value) => {
      item.indicators = {
        ...item.indicators,
        rsi2: value,
      };
    });

    indicators.apply('rsi', 14, (item, value) => {
      item.indicators = {
        ...item.indicators,
        rsi14: value,
      };
    });
  });

  const stringData = JSON.stringify(history, null, 2);
  fs.writeFileSync(HISTORY_FILE_PATH, stringData);
}

type TransitionResult = {
  asset: AssetEntity;
  event: AssetStatusChangedEvent;
  historyState: MarketHistoryExtended;
  marketData: MarketData;
};
type ReportData = TransitionResult & {
  previousEnterState: AssetStateKey;
  oldMarketData: MarketData;
  oldHistoryState: MarketHistoryExtended;
  minPrice: number;
  maxPrice: number;
};
export function assetRun(symbol: string) {
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
  let prevMarketHistory: MarketHistoryExtended = null;
  let previousEnterState: AssetStateKey = null;

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

  const transition: (hist: MarketHistoryExtended) => TransitionResult = (
    historyEntry: MarketHistoryExtended,
  ) => {
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
    .filter(a => a.date.getTime() >= moment(PARAMETERS.reportDateFrom).toDate().getTime())
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

      // we use high/low prices to trigger fsm but the real price we want to use is based on donchian values
      const reportPrice = (() => {
        switch (transitionResult.asset.state) {
          case 'REACH_TOP':
            return transitionResult.marketData.donchianOuter.maxValue;
          case 'REACH_BOTTOM':
            return transitionResult.marketData.donchianOuter.minValue;
          case 'NONE':
            return transitionResult.event.from === 'REACH_TOP' ||
              transitionResult.event.from === 'APPROACH_BOTTOM'
              ? transitionResult.marketData.donchianInner.minValue
              : transitionResult.marketData.donchianInner.maxValue;
          default:
            return transitionResult.marketData.price;
        }
      })();

      transitionResult.asset.stateData.enterPrice = reportPrice;
      transitionResult.marketData.price = reportPrice;
      transitionResult.event.currentPrice = reportPrice;

      assetState = transitionResult.asset;

      transitionResult.minPrice = transitionMinPrice;
      transitionResult.maxPrice = transitionMaxPrice;
      transitionResult.oldMarketData = prevMarketData;
      transitionResult.oldHistoryState = prevMarketHistory;
      transitionResult.previousEnterState = previousEnterState;

      if (isExit(transitionResult)) {
        previousEnterState = transitionResult.event.from;
      }

      transitionMinPrice = transitionResult.historyState.low;
      transitionMaxPrice = transitionResult.historyState.high;
      prevMarketData = transitionResult.marketData;
      prevMarketHistory = transitionResult.historyState;

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

export async function getAllSymbolsEvents() {
  const staticPool = new StaticPool({
    size: 12,
    task: path.join(__dirname, 'worker.ts'),
  });

  const symbols = _(snpSymbols())
    // .take(20)
    .value();
  const symbolsLeft = new Set(symbols);

  console.time('calculation');

  const unflattenResult = await Promise.all(
    symbols.map(async symbol => {
      const data = (await staticPool.exec(symbol)) as ReturnType<typeof assetRun>;
      symbolsLeft.delete(symbol);
      console.log(
        `(${symbols.length - symbolsLeft.size}/${symbols.length}) ${symbol} - ${
          data.length
        } events`,
      );
      return data;
    }),
  );

  console.timeEnd('calculation');

  return flattenDeep(unflattenResult);
}

export async function saveReport(events: ReportData[]) {
  const data2 = events.filter(isExit).map(i => {
    return {
      // Id: i.id,
      Symbol: i.event.symbol,
      'Enter Status': i.event.from,
      'Previous Enter Status': i.previousEnterState,
      'Enter Date': i.event.oldPriceDate,
      'Enter Price': i.event.oldPrice,
      'Enter STOP Price':
        i.event.from === 'REACH_TOP'
          ? i.oldMarketData?.donchianInner.minValue
          : i.oldMarketData?.donchianInner.maxValue,
      'Enter SMA(50)': i.oldHistoryState.indicators.sma50,
      'Enter SMA(200)': i.oldHistoryState.indicators.sma200,
      'Exit Price': i.event.currentPrice,
      'Exit Date': i.event.currentPriceDate,
      'Exit SMA(50)': i.historyState.indicators.sma50,
      'Exit SMA(200)': i.historyState.indicators.sma200,
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

// console.log(snpData()[0]);
