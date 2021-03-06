import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import * as moment from 'moment-timezone';
import * as yahoo from 'yahoo-finance';

import { MarketHistory, MultipleHistory, MultipleHistoryClass } from '../../types/history';
import { catchDivide, CatchDivideResult } from '../../utils/catch-divide';
import _ = require('lodash');

export type SummaryModuleKey = 'price' | 'summaryDetail' | 'defaultKeyStatistics' | 'financialData';

export type PriceModule = {
  postMarketSource: string; //"DELAYED",
  regularMarketPrice: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  exchange: string; // "NMS",
  exchangeName: string; //"NasdaqGS",
  quoteType: string; // "EQUITY",
  symbol: string; // "TSLA",
  shortName: string; //"Tesla, Inc.",
  longName: string; // "Tesla, Inc.",
  currency: string; // "USD",
  quoteSourceName: string; //"Nasdaq Real Time Price",
  currencySymbol: string; // "$"
};

export type SummaryDetailModule = {
  maxAge: number;
  priceHint: number;
  previousClose: number;
  open: number;
  dayLow: number;
  dayHigh: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  regularMarketDayLow: number;
  regularMarketDayHigh: number;
  dividendRate: number;
  dividendYield: number;
  exDividendDate: Date;
  payoutRatio: number;
  fiveYearAvgDividendYield: number;
  beta: number;
  trailingPE: number;
  forwardPE: number;
  volume: number;
  regularMarketVolume: number;
  averageVolume: number;
  averageVolume10days: number;
  averageDailyVolume10Day: number;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  marketCap: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  priceToSalesTrailing12Months: number;
  fiftyDayAverage: number;
  twoHundredDayAverage: number;
  trailingAnnualDividendRate: number;
  trailingAnnualDividendYield: number;
};

export type FinancialDataModule = {
  currentPrice: number;
  targetHighPrice: number;
  targetLowPrice: number;
  targetMeanPrice: number;
  targetMedianPrice: number;
  recommendationMean: number;
  recommendationKey: number;
  numberOfAnalystOpinions: number;
  totalCash: number;
  totalCashPerShare: number;
  ebitda: number;
  totalDebt: number;
  quickRatio: number;
  currentRatio: number;
  totalRevenue: number;
  debtToEquity: number;
  revenuePerShare: number;
  returnOnAssets: number;
  returnOnEquity: number;
  grossProfits: number;
  freeCashflow: number;
  operatingCashflow: number;
  revenueGrowth: number;
  grossMargins: number;
  ebitdaMargins: number;
  operatingMargins: number;
  profitMargins: number;
};

export type DefaultKeyStatisticsModule = {
  maxAge: number;
  forwardPE: number;
  profitMargins: number;
  floatShares: number;
  sharesOutstanding: number;
  sharesShort: number;
  sharesShortPriorMonth: number;
  heldPercentInsiders: number;
  heldPercentInstitutions: number;
  shortRatio: number;
  shortPercentOfFloat: number;
  beta: number;
  category: number;
  bookValue: number;
  priceToBook: number;
  fundFamily: number;
  legalType: number;
  lastFiscalYearEnd: Date;
  nextFiscalYearEnd: Date;
  mostRecentQuarter: Date;
  netIncomeToCommon: number;
  trailingEps: number;
  forwardEps: number;
  pegRatio: number;
  lastSplitFactor: number;
  lastSplitDate: Date;
  '52WeekChange': number;
  SandP52WeekChange: number;
};

// type Pattern<P, T extends P> = T;

// type Mapping = Pattern<
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   Record<SummaryModuleKey, any>,
//   {
//     price: PriceModule;
//     summaryDetail: SummaryDetailModule;
//     defaultKeyStatistics: DefaultKeyStatisticsModule;
//     financialData: FinancialDataModule;
//   }
// >;

export type SymbolSummary<M extends SummaryModuleKey> = {} & ('price' extends M
  ? { price: PriceModule }
  : {}) &
  ('defaultKeyStatistics' extends M ? { defaultKeyStatistics: DefaultKeyStatisticsModule } : {}) &
  ('financialData' extends M ? { financialData: FinancialDataModule } : {}) &
  ('summaryDetail' extends M ? { summaryDetail: SummaryDetailModule } : {});

function convertDateBackToUtc(date: Date) {
  return moment.tz(date, 'America/New_York').utc(true).toDate();
}

function normalizeHistory(hist: MarketHistory) {
  hist.date = convertDateBackToUtc(hist.date);
  return hist;
}

@Injectable()
export class YahooService {
  getHistory(symbols: string[], daysBack = 40) {
    const today = moment().startOf('day');
    const toDate = today.clone();
    const fromDate = toDate.clone().add({ days: -daysBack });

    return this.getHistoryDates(symbols, fromDate, toDate);
  }

  async getHistoryDates(
    symbols: string[],
    fromDate: moment.MomentInput,
    toDate?: moment.MomentInput,
  ) {
    if (!symbols?.length) {
      return {
        result: {},
        errors: [],
      } as CatchDivideResult<string, MultipleHistory>;
    }

    if (!fromDate) {
      fromDate = moment().add(-7, 'day');
    }

    if (!toDate) {
      toDate = moment();
    }

    const action = async (collection: string[]) => {
      if (!collection?.length) {
        return {};
      }

      const opts = {
        symbols: collection,
        // maxConcurrentSymbols: 20,
        error: true,
        from: moment(fromDate).startOf('day').format('YYYY-MM-DD'),
        to: moment(toDate).startOf('day').format('YYYY-MM-DD'),
        period: 'd', // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
      };

      const hist = await yahoo.historical(opts).catch(e => console.log(e));

      const x = plainToClass(MultipleHistoryClass, hist, {
        targetMaps: [
          {
            target: MultipleHistoryClass,
            properties: Object.keys(hist).reduce((prev, cur) => {
              return {
                ...prev,
                [cur]: MarketHistory,
              };
            }, {}),
          },
        ],
      }) as MultipleHistory;

      for (const [key, val] of Object.entries(x)) {
        val.forEach(normalizeHistory);
        x[key] = val;
      }

      return x;
    };
    return await catchDivide(symbols, action);
  }

  async getPrices(symbol: string): Promise<PriceModule> {
    const { price } = await this.getQuote(symbol, ['price']);
    return price;
  }

  async getFundamentals(symbol: string) {
    const quote = await this.getQuote(symbol, [
      'summaryDetail',
      'defaultKeyStatistics',
      'financialData',
    ]);
    return {
      ...quote.defaultKeyStatistics,
      ...quote.summaryDetail,
      ...quote.financialData,
    } as SummaryDetailModule & DefaultKeyStatisticsModule & FinancialDataModule;
  }

  async getQuote<T extends SummaryModuleKey>(symbol: string, modules: T[]) {
    try {
      const x: SymbolSummary<T> = await yahoo.quote(symbol, modules);
      return x;
    } catch (e) {
      return null;
    }
  }
}
