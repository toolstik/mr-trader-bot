import { Injectable } from '@nestjs/common';
import { createMachine } from '@xstate/fsm';
import * as moment from 'moment-timezone';

import { AssetStatusChangedEvent } from '../../events/asset-status-changed.event';
import { AssetStateKey, AssetStatus } from '../../types/commons';
import { FsmContext, FsmEvent, FsmState } from '../../types/fsm-types';
import { MarketHistory } from '../../types/history';
import { Bounds, MarketData } from '../../types/market-data';
import { AssetEntity } from '../asset/asset.entity';
import { AssetService } from '../asset/asset.service';
import { clone } from '../commands/utils';
import { EventEmitterService } from '../global/event-emitter.service';
import { PlainLogger } from '../global/plain-logger';
import { YahooService } from '../yahoo/yahoo.service';
import { Indicators } from './indicators';

const APPROACH_RATE = 0.005;

type GetAssetStatusOptions = {
  emitEvents: boolean;
  fundamentals: boolean;
};

const DEFAULT_GET_ASSET_STATUS_OPTIONS: GetAssetStatusOptions = {
  emitEvents: false,
  fundamentals: false,
};

export function compareMarketHistoryDesc(a: MarketHistory, b: MarketHistory) {
  const aTime = a?.date?.getDate();
  const bTime = b?.date?.getDate();

  if (!bTime && !aTime) {
    return 0;
  }

  if (!aTime) {
    return 1;
  }

  if (!aTime) {
    return -1;
  }

  return b.date.getTime() - a.date.getTime();
}

export function compareMarketHistoryAsc(a: MarketHistory, b: MarketHistory) {
  return -compareMarketHistoryDesc(a, b);
}

export function fsmTransition(asset: AssetEntity, marketData: MarketData) {
  const myAction = (transition: { from: AssetStateKey; to: AssetStateKey }) => {
    return (ctx: FsmContext, e: FsmEvent) => {
      // console.debug(transition);
      const event: AssetStatusChangedEvent = {
        symbol: ctx.asset.symbol,
        from: transition.from,
        to: transition.to,
        oldPrice: ctx.asset.stateData?.enterPrice,
        oldPriceDate: ctx.asset.stateData?.enterTimestamp,
        currentPrice: e.payload.price,
        currentPriceDate: marketData.date,
        marketData,
      };

      // return this.eventEmitter.emitAsync(AssetStatusChangedEvent, event);
      ctx.asset.state = transition.to;
      ctx.asset.stateData = {
        enterTimestamp: marketData.date,
        enterPrice: e.payload.price,
      };
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

export function fsmDeepTransition(asset: AssetEntity, marketData: MarketData, log?: PlainLogger) {
  // console.time('fsm');

  if (!log) {
    log = console;
  }

  const initContext: FsmContext = {
    asset,
    events: [],
  };

  const context = clone(initContext);

  const visitedStates = new Set<AssetStateKey>();

  let i = 0;
  while (i < 5) {
    // console.timeLog('fsm', 'transition', newState.value, newState.changed);

    visitedStates.add(context.asset.state || 'NONE');

    const ctx = fsmTransition(context.asset, marketData);

    // no transition ocurred
    if (context && !ctx.events.length) {
      break;
    }

    // fsm cycle detected
    if (visitedStates.has(ctx.asset.state)) {
      log.warn('FSM cycle detected', {
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

function getMarketState(data: MarketData): AssetStateKey {
  if (data.price > data.bounds.top.value) {
    return 'REACH_TOP';
  }

  if (data.price * (1 + APPROACH_RATE) > data.bounds.top.value) {
    return 'APPROACH_TOP';
  }

  if (data.price < data.bounds.bottom.value) {
    return 'REACH_BOTTOM';
  }

  if (data.price * (1 - APPROACH_RATE) < data.bounds.bottom.value) {
    return 'APPROACH_BOTTOM';
  }

  return 'NONE';
}

function topStop(data: MarketData) {
  return data.price < data.bounds.stopTop.value;
}

function bottomStop(data: MarketData) {
  return data.price > data.bounds.stopBottom.value;
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
    const result = fsmDeepTransition(asset, marketData, this.log);

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

    const asset = await this.assetService.findOne(symbol);

    const today = moment().startOf('day').utc(true);

    const currentMarketHistory = {
      symbol: asset.symbol,
      date: today.toDate(),
      volume: price.regularMarketVolume,
      high: price.regularMarketDayHigh,
      low: price.regularMarketDayLow,
      close: price.regularMarketPrice,
      adjClose: price.regularMarketPrice,
      open: price.regularMarketOpen,
    } as MarketHistory;

    const history =
      today.diff(asset.history[0].date, 'hour') > 6
        ? [currentMarketHistory, ...asset.history]
        : asset.history;

    const indicators = new Indicators(history.reverse(), true);

    const donchian20 = indicators.getLast('donchian', 20);
    const donchian5 = indicators.getLast('donchian', 5);
    const fractals = indicators.getLast('fractal', 2);

    if (!donchian20 || !donchian5) {
      return null;
    }

    const bounds = {
      top: {
        type: 'donchian',
        value: donchian20.maxValue,
        periods: donchian20.maxDays,
      },
      bottom: {
        type: 'donchian',
        value: donchian20.minValue,
        periods: donchian20.minDays,
      },
      stopTop: fractals.minValue
        ? {
            type: 'fractal',
            value: fractals.minValue,
          }
        : {
            type: 'donchian',
            value: donchian5.minValue,
            periods: donchian5.minDays,
          },

      stopBottom: fractals.maxValue
        ? {
            type: 'fractal',
            value: fractals.maxValue,
          }
        : {
            type: 'donchian',
            value: donchian5.maxValue,
            periods: donchian5.maxDays,
          },
    } as Bounds;

    return {
      date: new Date(),
      price: price.regularMarketPrice,
      asset: price,
      donchianOuter: donchian20,
      donchianInner: donchian5,
      fractals,
      bounds,
    };
  }
}
