import { Type } from 'class-transformer';
import _ = require('lodash');
import { rsi, sma } from 'technicalindicators';
import { PartialDeep } from 'type-fest';

import { compareMarketHistoryAsc } from '../../src/modules/analysis/analysis.service';
import { MarketHistory } from '../../src/types/history';
import { Donchian } from '../../src/types/market-data';
import { MarketHistoryExtended } from './main';

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

export class FractalBounds {
  minValue: number;

  @Type(() => Date)
  minDate: Date;

  maxValue: number;

  @Type(() => Date)
  maxDate: Date;
}

export class Indicators {
  private readonly sortedCollection: MarketHistory[];

  constructor(private inputCollection: MarketHistory[]) {
    this.sortedCollection = inputCollection.sort(compareMarketHistoryAsc);
  }

  get value() {
    return this.inputCollection as MarketHistoryExtended[];
  }

  get valueSortedDesc() {
    return this.sortedCollection.reverse() as MarketHistoryExtended[];
  }

  get valueSortedAsc() {
    return this.sortedCollection as MarketHistoryExtended[];
  }

  smaIndicator(period: number): number[] {
    const values = this.sortedCollection.map(i => i.close);
    return [...Array(period - 1).fill(null), ...sma({ period, values })];
  }

  rsiIndicator(period: number): number[] {
    const values = this.sortedCollection.map(i => i.close);
    return [...Array(period).fill(null), ...rsi({ period, values })];
  }

  private floatingBuffer<T>(
    bufferSize: number,
    inclusive: boolean,
    func: (buf: MarketHistory[], current?: MarketHistory, prev?: T) => T,
  ): T[] {
    const updateBuffer = (buf: MarketHistory[], item: MarketHistory) => {
      buf.push(item);
      if (buf.length > bufferSize) {
        buf = buf.slice(buf.length - bufferSize, buf.length);
      }
      return buf;
    };

    let buffer = [] as MarketHistory[];
    const result = [] as T[];
    let prevValue: T = null;

    for (const item of this.sortedCollection) {
      if (inclusive) {
        buffer = updateBuffer(buffer, item);
      }

      const itemResult = buffer.length >= bufferSize ? func(buffer, item, prevValue) : null;
      prevValue = itemResult;
      result.push(itemResult);
      if (!inclusive) {
        buffer = updateBuffer(buffer, item);
      }
    }

    return result;
  }

  fractalIndicator(buffer: number): FractalBounds[] {
    buffer = buffer ?? 2;
    const fractalLength = buffer * 2 + 1;

    const middleExtrem = (data: number[], type: 'min' | 'max') => {
      const criteria = type === 'min' ? (a, b) => a < b : (a, b) => a > b;
      const middleValue = data[buffer];
      const boundValues = data.filter((a, i) => i !== buffer);
      for (const item of boundValues) {
        if (!criteria(middleValue, item)) {
          return null;
        }
      }

      return middleValue;
    };

    const fractalMin = (buf: MarketHistory[]) => {
      const v = buf.map(i => i.low);
      return middleExtrem(v, 'min');
    };

    const fractalMax = (buf: MarketHistory[]) => {
      const v = buf.map(i => i.high);
      return middleExtrem(v, 'max');
    };

    return this.floatingBuffer(fractalLength, false, (buf, item, prev) => {
      const fracMax = fractalMax(buf);
      const fracMin = fractalMin(buf);

      let result = prev;

      const middleDate = buf[buffer].date;

      if (fracMax !== null) {
        result = {
          ...result,
          maxValue: fracMax,
          maxDate: middleDate,
        };
      }

      if (fracMin !== null) {
        result = {
          ...result,
          minValue: fracMin,
          minDate: middleDate,
        };
      }

      return result;
    });
  }

  donchianIndicator(period: number): Donchian[] {
    return this.floatingBuffer(period, false, buf => {
      return {
        maxValue: Math.max(...buf.map(i => i.high)),
        maxDays: period,
        minValue: Math.min(...buf.map(i => i.low)),
        minDays: period,
      };
    });
  }

  apply<K extends IndicatorId>(
    indicator: K,
    arg: IndicatorArgs<K>,
    func: (
      val: IndicatorResult<K>,
      item?: MarketHistoryExtended,
    ) => PartialDeep<MarketHistoryExtended> | void,
  ) {
    let indicatorFunc: IndicatorFunc<K> = this[`${indicator}Indicator`];
    indicatorFunc = indicatorFunc.bind(this);
    const resultArray = indicatorFunc(arg);

    this.sortedCollection.forEach((item, i) => {
      const res = func(resultArray[i], item as MarketHistoryExtended);

      if (typeof res === 'object') {
        _.merge(item, res);
      }
    });

    return this;
  }
}
