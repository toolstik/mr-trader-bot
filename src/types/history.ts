import { Transform } from 'class-transformer';

import { dateTo } from './commons';

export class MarketHistory {
  @Transform(dateTo('number'))
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
  symbol: string;
}

export type SymbolHistory = MarketHistory[];

export type MultipleHistory = Record<string, SymbolHistory>;

export class MultipleHistoryClass {
  [key: string]: Object;
}
