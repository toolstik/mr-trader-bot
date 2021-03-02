import { Injectable } from '@nestjs/common';
import { Finviz, FinVizAttribute } from 'ts-finviz/lib';
import _ = require('lodash');

export type FinvizData = {
  rsi14: number;
};

@Injectable()
export class FinvizService {
  async fetchData(ticker: string) {
    if (!ticker || ticker.toUpperCase().endsWith('.ME')) {
      return null;
    }

    try {
      // console.time(ticker);
      const result = await Finviz.getStockData(ticker);

      return {
        rsi14: _.toNumber(result[FinVizAttribute.RSI]),
      } as FinvizData;
    } finally {
      // console.timeEnd(ticker);
    }
  }
}
