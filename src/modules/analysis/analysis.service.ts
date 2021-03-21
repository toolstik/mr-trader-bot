import { Injectable } from '@nestjs/common';
import { createMachine } from '@xstate/fsm';
import * as _ from 'lodash';
import * as moment from 'moment-timezone';

import { AssetStatusChangedEvent } from '../../events/asset-status-changed.event';
import { AssetStateKey, AssetStatus } from '../../types/commons';
import { FsmContext, FsmEvent, FsmState } from '../../types/fsm-types';
import { Donchian, MarketData } from '../../types/market-data';
import { AssetService } from '../asset/asset.service';
import { EventEmitterService } from '../global/event-emitter.service';
import { YahooService } from '../yahoo/yahoo.service';

const APPROACH_RATE = 0.005;

function getMarketState(data: MarketData): AssetStateKey {
  if (data.price >= data.donchian.maxValue) {
    return 'REACH_TOP';
  }

  if (data.price * (1 + APPROACH_RATE) >= data.donchian.maxValue) {
    return 'APPROACH_TOP';
  }

  if (data.price <= data.donchian.minValue) {
    return 'REACH_BOTTOM';
  }

  if (data.price * (1 - APPROACH_RATE) <= data.donchian.minValue) {
    return 'APPROACH_BOTTOM';
  }

  return 'NONE';
}

function topStop(data: MarketData) {
  return data.price <= data.stopLoss;
}

function bottomStop(data: MarketData) {
  return data.price >= data.takeProfit;
}

@Injectable()
export class AnalysisService {
  constructor(
    private assetService: AssetService,
    private yahooService: YahooService,
    private eventEmitter: EventEmitterService,
  ) {}

  async updateAssetStatus(symbol: string) {
    const [asset, marketData] = await Promise.all([
      this.assetService.getOne(symbol),
      this.getMarketData(symbol),
      // this.assetService.getFundamentals(symbol),
    ]);

    if (asset == null || marketData === null) {
      return;
    }

    await this.deepTransition(asset.state ?? 'NONE', { asset }, marketData);
  }

  async getAssetStatus(symbol: string) {
    const [asset, marketData] = await Promise.all([
      this.assetService.getOne(symbol),
      this.getMarketData(symbol),
      // this.assetService.getFundamentals(symbol),
    ]);

    if (asset == null || marketData === null) {
      return null;
    }

    const status = await this.deepTransition(asset.state ?? 'NONE', { asset }, marketData);

    return {
      ticker: asset.symbol,
      status: status.value,
      changed: status.changed,
      marketData,
    } as AssetStatus;
  }

  private async getMarketData(symbol: string) {
    const price = await this.yahooService.getPrices(symbol);
    // console.log(symbol, price);
    if (!price?.regularMarketPrice) {
      return null;
    }

    const donchian20 = await this.getDonchian(symbol, 20);
    const donchian5 = await this.getDonchian(symbol, 5);

    if (!donchian20 || !donchian5) {
      return null;
    }

    return {
      price: price.regularMarketPrice,
      asset: _.omit(price, 'regularMarketPrice'),
      donchian: donchian20,
      stopLoss: donchian5.minValue,
      takeProfit: donchian5.maxValue,
    } as MarketData;
  }

  private async getDonchian(symbol: string, daysBack: number) {
    const asset = await this.assetService.getOne(symbol);

    if (!asset?.history) {
      return null;
    }

    const today = moment().startOf('day').toDate().getTime();

    const donchian = asset.history
      .filter(a => a.date.getDate() < today) //before today only
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, daysBack)
      .reduce(
        (prev, cur) => {
          return {
            ...prev,
            minValue: Math.min(prev.minValue, cur.low),
            maxValue: Math.max(prev.maxValue, cur.high),
          };
        },
        {
          minDays: daysBack,
          minValue: Number.MAX_VALUE,
          maxDays: daysBack,
          maxValue: Number.MIN_VALUE,
        } as Donchian,
      );

    return donchian;
  }

  private createFsm(state: AssetStateKey, context: FsmContext) {
    const myAction = (transition: { from: AssetStateKey; to: AssetStateKey }) => {
      return async (ctx: FsmContext, e: FsmEvent) => {
        console.debug(transition);
        await this.eventEmitter.emitAsync(AssetStatusChangedEvent, {
          symbol: ctx.asset.symbol,
          from: transition.from,
          to: transition.to,
          oldPrice: ctx.asset.stateData?.enterPrice,
          currentPrice: e.payload.price,
        });
      };
    };

    return createMachine<FsmContext, FsmEvent, FsmState>({
      initial: state,
      context: context,
      states: {
        REACH_TOP: {
          on: {
            update: [
              {
                target: 'NONE',
                cond: (ctx, { payload: data }) => {
                  return topStop(data);
                },
                actions: myAction({ from: 'REACH_TOP', to: 'NONE' }),
              },
            ],
          },
        },
        APPROACH_TOP: {
          on: {
            update: [
              {
                target: 'REACH_TOP',
                cond: (ctx, { payload: data }) => {
                  return getMarketState(data) === 'REACH_TOP';
                },
                actions: myAction({ from: 'APPROACH_TOP', to: 'REACH_TOP' }),
              },
              {
                target: 'NONE',
                cond: (ctx, { payload: data }) => {
                  return topStop(data);
                },
                actions: myAction({ from: 'APPROACH_TOP', to: 'NONE' }),
              },
            ],
          },
        },
        REACH_BOTTOM: {
          on: {
            update: [
              {
                target: 'NONE',
                cond: (ctx, { payload: data }) => {
                  return bottomStop(data);
                },
                actions: myAction({ from: 'REACH_BOTTOM', to: 'NONE' }),
              },
            ],
          },
        },
        APPROACH_BOTTOM: {
          on: {
            update: [
              {
                target: 'REACH_BOTTOM',
                cond: (ctx, { payload: data }) => {
                  return getMarketState(data) === 'REACH_BOTTOM';
                },
                actions: myAction({ from: 'APPROACH_BOTTOM', to: 'REACH_BOTTOM' }),
              },
              {
                target: 'NONE',
                cond: (ctx, { payload: data }) => {
                  return bottomStop(data);
                },
                actions: myAction({ from: 'APPROACH_BOTTOM', to: 'REACH_BOTTOM' }),
              },
            ],
          },
        },
        NONE: {
          on: {
            update: [
              {
                target: 'REACH_TOP',
                cond: (ctx, { payload: data }) => {
                  return getMarketState(data) === 'REACH_TOP';
                },
                actions: myAction({ from: 'NONE', to: 'REACH_TOP' }),
              },
              {
                target: 'APPROACH_TOP',
                cond: (ctx, { payload: data }) => {
                  return getMarketState(data) === 'APPROACH_TOP';
                },
                actions: myAction({ from: 'NONE', to: 'APPROACH_TOP' }),
              },
              {
                target: 'REACH_BOTTOM',
                cond: (ctx, { payload: data }) => {
                  return getMarketState(data) === 'REACH_BOTTOM';
                },
                actions: myAction({ from: 'NONE', to: 'REACH_BOTTOM' }),
              },
              {
                target: 'APPROACH_BOTTOM',
                cond: (ctx, { payload: data }) => {
                  return getMarketState(data) === 'APPROACH_BOTTOM';
                },
                actions: myAction({ from: 'NONE', to: 'APPROACH_BOTTOM' }),
              },
            ],
          },
        },
      },
    });
  }

  private async deepTransition(state: AssetStateKey, context: FsmContext, data: MarketData) {
    console.time('fsm');
    const fsm = this.createFsm(state, context);

    let curState = fsm.initialState;

    const event: FsmEvent<'update'> = {
      type: 'update',
      payload: data,
    };

    // REMOVE!!!!
    data.price = data.price * 1.2;

    let i = 0;
    while (i < 5) {
      const newState = fsm.transition(curState, event);
      console.timeLog('fsm', 'transition', newState.value, newState.changed);

      if (!newState.changed) {
        break;
      }

      for (const action of newState.actions || []) {
        await action.exec(context, event);
      }

      curState = newState;
      i++;
    }

    console.timeEnd('fsm');
    return curState;
  }
}
