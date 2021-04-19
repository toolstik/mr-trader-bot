import { Injectable } from '@nestjs/common';
import { createMachine } from '@xstate/fsm';
import * as _ from 'lodash';
import * as moment from 'moment-timezone';

import { AssetStatusChangedEvent } from '../../events/asset-status-changed.event';
import { AssetStateKey, AssetStatus } from '../../types/commons';
import { FsmContext, FsmEvent, FsmState } from '../../types/fsm-types';
import { Donchian, MarketData } from '../../types/market-data';
import { AssetEntity } from '../asset/asset.entity';
import { AssetService } from '../asset/asset.service';
import { clone } from '../commands/utils';
import { EventEmitterService } from '../global/event-emitter.service';
import { PlainLogger } from '../global/plain-logger';
import { YahooService } from '../yahoo/yahoo.service';

const APPROACH_RATE = 0.005;

type GetAssetStatusOptions = {
  emitEvents: boolean;
  fundamentals: boolean;
};

const DEFAULT_GET_ASSET_STATUS_OPTIONS: GetAssetStatusOptions = {
  emitEvents: false,
  fundamentals: false,
};

function getMarketState(data: MarketData): AssetStateKey {
  if (data.price > data.donchianOuter.maxValue) {
    return 'REACH_TOP';
  }

  if (data.price * (1 + APPROACH_RATE) > data.donchianOuter.maxValue) {
    return 'APPROACH_TOP';
  }

  if (data.price < data.donchianOuter.minValue) {
    return 'REACH_BOTTOM';
  }

  if (data.price * (1 - APPROACH_RATE) < data.donchianOuter.minValue) {
    return 'APPROACH_BOTTOM';
  }

  return 'NONE';
}

function topStop(data: MarketData) {
  return data.price < data.donchianInner.minValue;
}

function bottomStop(data: MarketData) {
  return data.price > data.donchianInner.maxValue;
}

@Injectable()
export class AnalysisService {
  constructor(
    private log: PlainLogger,
    private assetService: AssetService,
    private yahooService: YahooService,
    private eventEmitter: EventEmitterService,
  ) {}

  async getAssetStatus(symbol: string, options?: Partial<GetAssetStatusOptions>) {
    options = {
      ...DEFAULT_GET_ASSET_STATUS_OPTIONS,
      ...options,
    };

    const [asset, marketData, fundamentals] = await Promise.all([
      this.assetService.findOne(symbol),
      this.getMarketData(symbol),
      options.fundamentals ? this.assetService.getFundamentals(symbol) : null,
    ]);

    if (asset === null || marketData === null) {
      return null;
    }
    const result = await this.fsmDeepTransition(asset, marketData);

    if (options.emitEvents) {
      for (const e of result.events) {
        await this.eventEmitter.emitAsync(AssetStatusChangedEvent, e);
      }
    }

    return {
      ticker: asset.symbol,
      status: result.asset.state,
      changed: result.events.length > 0,
      events: result.events,
      marketData,
      fundamentals,
    } as AssetStatus;
  }

  private async getMarketData(symbol: string): Promise<MarketData> {
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
      donchianOuter: donchian20,
      donchianInner: donchian5,
    };
  }

  private async getDonchian(symbol: string, daysBack: number) {
    const asset = await this.assetService.findOne(symbol);

    if (!asset?.history) {
      return null;
    }

    const today = moment().startOf('day').toDate().getTime();

    const donchian = asset.history
      .filter(a => {
        if (!a.date || !a.high || !a.low) {
          return false;
        }

        //before today only
        if (a.date.getDate() >= today) {
          return false;
        }

        return true;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, daysBack)
      .reduce(
        (prev, cur) => {
          return {
            ...prev,
            minValue: cur.low ? Math.min(prev.minValue, cur.low) : prev.minValue,
            maxValue: cur.high ? Math.max(prev.maxValue, cur.high) : prev.maxValue,
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

  private async fsmTransition(asset: AssetEntity, marketData: MarketData) {
    const myAction = (transition: { from: AssetStateKey; to: AssetStateKey }) => {
      return (ctx: FsmContext, e: FsmEvent) => {
        // console.debug(transition);
        const event: AssetStatusChangedEvent = {
          symbol: ctx.asset.symbol,
          from: transition.from,
          to: transition.to,
          oldPrice: ctx.asset.stateData?.enterPrice,
          currentPrice: e.payload.price,
          marketData,
        };

        // return this.eventEmitter.emitAsync(AssetStatusChangedEvent, event);
        ctx.asset.state = transition.to;
        ctx.events.push(event);

        // console.log(ctx);
      };
    };

    const context: FsmContext = {
      asset,
      events: [],
    };

    const fsm = createMachine<FsmContext, FsmEvent, FsmState>({
      initial: asset.state ?? 'NONE',
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
                actions: myAction({ from: 'APPROACH_BOTTOM', to: 'NONE' }),
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

    const fsmEvent: FsmEvent<'update'> = {
      type: 'update',
      payload: marketData,
    };

    const newState = fsm.transition(fsm.initialState, fsmEvent);

    for (const action of newState.actions || []) {
      action.exec(context, fsmEvent);
    }

    return context;
  }

  private async fsmDeepTransition(asset: AssetEntity, marketData: MarketData) {
    // console.time('fsm');

    const initContext: FsmContext = {
      asset,
      events: [],
    };

    const context = clone(initContext);

    const metStates = new Set<AssetStateKey>();

    let i = 0;
    while (i < 5) {
      // console.timeLog('fsm', 'transition', newState.value, newState.changed);

      metStates.add(context.asset.state || 'NONE');

      const ctx = await this.fsmTransition(context.asset, marketData);

      // no transition ocurred
      if (context && !ctx.events.length) {
        break;
      }

      // fsm cycle detected
      if (metStates.has(ctx.asset.state)) {
        this.log.warn('FSM cycle detected', {
          asset,
          marketData,
          cycleState: ctx.asset.state,
        });
        return initContext;
      }

      context.asset = ctx.asset;
      context.events.push(...ctx.events);

      i++;
    }

    // console.timeEnd('fsm');
    return context;
  }
}
