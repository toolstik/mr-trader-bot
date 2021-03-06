import { Transform, TransformationType } from 'class-transformer';

import { AssetStatusChangedEvent } from '../events/asset-status-changed.event';
import { MarketData } from './market-data';

export const AssetStateArray = [
  'APPROACH_TOP',
  'APPROACH_BOTTOM',
  'REACH_TOP',
  'REACH_BOTTOM',
  'NONE',
] as const;

export type AssetStateKey = ArrayItem<typeof AssetStateArray>;

export const StatusChangedArray = [
  'REACH_TOP',
  'APPROACH_TOP',
  'STOP_TOP',
  'REACH_BOTTOM',
  'APPROACH_BOTTOM',
  'STOP_BOTTOM',
] as const;

export type StatusChangedKey = ArrayItem<typeof StatusChangedArray>;

export type AssetStatus = {
  ticker: string;
  status: AssetStateKey;
  changed: boolean;
  events?: AssetStatusChangedEvent[];
  marketData: MarketData;
  fundamentals?: FundamentalData;
};

export type RefEntity<T> = Record<string, T>;

export class RefEntityObject {
  [key: string]: Object;
}

export type FundamentalData = {
  ticker: string;
  trailingPE: number;
  priceToBook: number;
  priceToSales: number;
  trailingEps: number;
  currentRatio: number;
  dividentAnnualPercent: number;
  sma50: number;
  sma200: number;
  rsi13: number;
  rsi14: number;
};

export type Page<T> = {
  pageNum: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  items: T[];
};

export function paginate<T>(array: T[], size = 15): Page<T>[] {
  return array
    ?.reduce((acc, val, i) => {
      const idx = Math.floor(i / size);
      const page = acc[idx] || (acc[idx] = []);
      page.push(val);
      return acc;
    }, [] as T[][])
    .map((p, i, a) => {
      return {
        pageNum: i + 1,
        pageSize: p.length,
        totalPages: a.length,
        totalItems: array.length,
        items: p,
      } as Page<T>;
    });
}

type ArrayItem<T> = T extends (infer R)[] ? R : T extends readonly (infer R)[] ? R : never;
export const KnownListKeys = ['nasdaq', 'snp500'] as const;
export type ListKey = ArrayItem<typeof KnownListKeys>;

export function dateTo(targetType: 'string' | 'number'): Parameters<typeof Transform>[0] {
  return ({ value, type }) => {
    if (type === TransformationType.PLAIN_TO_CLASS) {
      if (typeof value !== 'object') {
        return new Date(value);
      }
      // if (value instanceof FirebaseFirestore.Timestamp) {
      //   return value.toDate();
      // }
      return value;
    }

    if (type === TransformationType.CLASS_TO_PLAIN) {
      if (value instanceof Date) {
        if (targetType === 'number') {
          return value.getTime();
        }

        if (targetType === 'string') {
          return value.toISOString();
        }

        // if (targetType === 'timestamp') {
        //   return FirebaseFirestore.Timestamp.fromDate(value);
        // }

        // console.log('%%%%%', { targetType, value, result });
      }
      return value;
    }

    return value;
  };
}
