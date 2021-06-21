/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/no-var-requires */

import * as fs from 'fs';
import _ = require('lodash');
import moment = require('moment');
import { Type } from 'class-transformer';
import { Column, Workbook } from 'exceljs';
import { flattenDeep } from 'lodash';
import { StaticPool } from 'node-worker-threads-pool-ts';
import * as path from 'path';

import { AssetStatusChangedEvent } from '../../src/events/asset-status-changed.event';
import {
  compareMarketHistoryAsc,
  donchianFunc,
  fsmDeepTransition,
} from '../../src/modules/analysis/analysis.service';
import { AssetEntity } from '../../src/modules/asset/asset.entity';
import { SnP500ListItem } from '../../src/modules/datahub/datahub.service';
import { YahooService } from '../../src/modules/yahoo/yahoo.service';
import { AssetStateKey } from '../../src/types/commons';
import { MarketHistory } from '../../src/types/history';
import { Donchian, MarketData } from '../../src/types/market-data';
import { plainToRecord } from '../../src/utils/record-transform';
import { FractalBounds, Indicators } from './indicators';

const HISTORY_FILE_PATH = path.join(__dirname, 'history-data.json');

type StopMode = 'donchian' | 'fractal';
const PARAMETERS = {
  donchianOuter: 20,
  donchianInner: 5,
  fractal: 2, // по 2 в каждую сторону, т.е. всего 5 дней
  stopMode: 'fractal' as StopMode,
  historyDateFrom: '2015-01-01',
  reportDateFrom: '2016-01-01',
};

class MarketHistoryIndicators {
  sma5: number;
  sma50: number;
  sma200: number;
  rsi2: number;
  rsi14: number;

  @Type(() => FractalBounds)
  fractal5: FractalBounds;
  donchianInner: Donchian;
  donchianOuter: Donchian;
}

export class MarketHistoryExtended extends MarketHistory {
  // sma50: number;
  // sma200: number;
  @Type(() => MarketHistoryIndicators)
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

export function historyData() {
  let result = require(HISTORY_FILE_PATH);
  result = plainToRecord(MarketHistory, result);
  return result as Record<string, MarketHistory[]>;
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

export function updateHistory(assetHist: MarketHistory[]) {
  const indicators = new Indicators(assetHist);

  return indicators
    .apply('sma', 5, value => ({
      indicators: {
        sma5: value,
      },
    }))
    .apply('sma', 50, value => ({
      indicators: {
        sma50: value,
      },
    }))
    .apply('sma', 200, value => ({
      indicators: {
        sma200: value,
      },
    }))
    .apply('rsi', 2, value => ({
      indicators: {
        rsi2: value,
      },
    }))
    .apply('rsi', 14, value => ({
      indicators: {
        rsi14: value,
      },
    }))
    .apply('fractal', 2, value => ({
      indicators: {
        fractal5: value,
      },
    }))
    .apply('donchian', PARAMETERS.donchianInner, value => ({
      indicators: {
        donchianInner: value,
      },
    }))
    .apply('donchian', PARAMETERS.donchianOuter, value => ({
      indicators: {
        donchianOuter: value,
      },
    })).valueSortedDesc;
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
  const plainHistory = historyData()[symbol];

  if (!plainHistory) {
    return [];
  }

  // console.log('&&&&&&&&&&', symbol, plainHistory?.length ?? 'null');
  const assetHistory = updateHistory(plainHistory);

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
    const value = donchianFunc(assetHistory, date, daysBack, true);

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

    const outerBounds = historyEntry.indicators.donchianOuter;

    if (!outerBounds) {
      return defaultResult;
    }

    const innerBounds =
      // если фрактал старше внешнего дончиана, то берем внешний дончиан
      PARAMETERS.stopMode === 'fractal'
        ? ({
            ...(moment(historyEntry.date).diff(historyEntry.indicators.fractal5.minDate, 'day') <=
            PARAMETERS.donchianOuter
              ? {
                  minValue: historyEntry.indicators.fractal5.minValue,
                }
              : {
                  minValue: historyEntry.indicators.donchianOuter.minValue,
                  minDays: historyEntry.indicators.donchianOuter.minDays,
                }),
            ...(moment(historyEntry.date).diff(historyEntry.indicators.fractal5.maxDate, 'day') <=
            PARAMETERS.donchianOuter
              ? {
                  maxValue: historyEntry.indicators.fractal5.maxValue,
                }
              : {
                  maxValue: historyEntry.indicators.donchianOuter.maxValue,
                  maxDays: historyEntry.indicators.donchianOuter.maxValue,
                }),
          } as Donchian)
        : historyEntry.indicators.donchianInner;

    if (!innerBounds) {
      return defaultResult;
    }

    const marketDataHigh = {
      date: historyEntry.date,
      price: historyEntry.high,
      donchianOuter: outerBounds,
      donchianInner: innerBounds,
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
      donchianOuter: outerBounds,
      donchianInner: innerBounds,
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
    size: 8,
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
      'Enter SMA(5)': i.oldHistoryState.indicators.sma5,
      'Enter SMA(50)': i.oldHistoryState.indicators.sma50,
      'Enter SMA(200)': i.oldHistoryState.indicators.sma200,
      'Enter RSI(2)': i.oldHistoryState.indicators.rsi2,
      'Enter RSI(14)': i.oldHistoryState.indicators.rsi14,
      'Exit Price': i.event.currentPrice,
      'Exit Date': i.event.currentPriceDate,
      'Exit SMA(5)': i.historyState.indicators.sma5,
      'Exit SMA(50)': i.historyState.indicators.sma50,
      'Exit SMA(200)': i.historyState.indicators.sma200,
      'Exit RSI(2)': i.historyState.indicators.rsi2,
      'Exit RSI(14)': i.historyState.indicators.rsi14,
      [`Exit MIN(${PARAMETERS.donchianOuter})`]: i.historyState.indicators.donchianOuter.minValue,
      [`Exit MAX(${PARAMETERS.donchianOuter})`]: i.historyState.indicators.donchianOuter.maxValue,
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
