import PromisePool = require('@supercharge/promise-pool/dist');

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AssetStatusChangedEvent } from '../../events/asset-status-changed.event';
import { BaseEntityService } from '../../services/base-entity.service';
import { FundamentalData, RefEntity } from '../../types/commons';
import { FinvizService } from '../finviz/finviz.service';
import { PlainLogger } from '../global/plain-logger';
import { SessionService } from '../session/session.service';
import { YahooService } from '../yahoo/yahoo.service';
import { AssetEntity } from './asset.entity';
import { AssetRepository } from './asset.repository';

@Injectable()
export class AssetService extends BaseEntityService<AssetEntity> {
  private readonly HISTORY_DAYS_BACK = 20;

  constructor(
    private log: PlainLogger,
    private repository: AssetRepository,
    private yahoo: YahooService,
    private finviz: FinvizService,
    private sessionService: SessionService,
  ) {
    super(repository);
  }

  async updateHistory(symbols?: string[]) {
    const symbs = symbols ?? (await this.sessionService.getSessionTickers());

    const histories = await this.yahoo.getHistory(symbs, this.HISTORY_DAYS_BACK + 20);
    const value = (await this.repository.findAll()) ?? {};

    const newValue = Object.entries(histories.result || {}).reduce((prev, [key, val]) => {
      const normKey = this.repository.normalizeKey(key);
      prev[normKey] = {
        state: 'NONE',
        symbol: key,
        ...value[normKey],
        historyUpdateAt: new Date(),
        history: val,
      };
      return prev;
    }, {} as RefEntity<AssetEntity>);

    if (symbols) {
      await this.repository.saveAll({
        ...value,
        ...newValue,
      });
    } else {
      await this.repository.saveAll(newValue);
    }

    this.log.info('Asset history updated', {
      arg: symbols,
      count: Object.keys(newValue || {}).length,
      symbols: Object.keys(newValue || {}),
      errors: histories.errors,
    });

    return {
      newValue,
      errors: histories.errors,
    };
  }

  async symbolsCheck(symbols: string[]) {
    const x = await PromisePool.withConcurrency(10)
      .for(symbols)
      .process(async symbol => {
        try {
          const price = await this.yahoo.getPrices(symbol);
          if (price.regularMarketPrice && price.postMarketSource !== 'DELAYED') {
            return {
              success: [symbol],
            };
          } else {
            return {
              error: [symbol],
            };
          }
        } catch {
          return {
            error: [symbol],
          };
        }
      })
      .then(r => {
        return r.results.reduce(
          (prev, cur) => {
            return {
              success: [...prev.success, ...(cur.success || [])],
              error: [...prev.error, ...(cur.error || [])],
            };
          },
          {
            success: [] as string[],
            error: [] as string[],
          },
        );
      });

    return x;
  }

  async getFundamentals(symbol: string) {
    const [yh, fv] = await Promise.all([
      this.yahoo.getFundamentals(symbol),
      this.finviz.fetchData(symbol),
    ]);

    return {
      ticker: symbol,
      trailingPE: yh.trailingPE,
      priceToBook: yh.priceToBook,
      priceToSales: yh.priceToSalesTrailing12Months,
      trailingEps: yh.trailingEps,
      currentRatio: yh.currentRatio,
      dividentAnnualPercent: yh.trailingAnnualDividendYield * 100,
      sma50: yh.fiftyDayAverage,
      sma200: yh.twoHundredDayAverage,
      rsi14: fv?.rsi14,
    } as FundamentalData;
  }

  @OnEvent(AssetStatusChangedEvent.event)
  async handleAssetStatusChangedEvent(event: AssetStatusChangedEvent) {
    await this.updateOne(event.symbol, v => ({
      ...v,
      state: event.to,
      stateData: {
        enterTimestamp: new Date(),
        enterPrice: event.currentPrice,
      },
    }));
  }
}
