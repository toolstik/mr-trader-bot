import { createMachine } from '@xstate/fsm';

import { AssetStateKey } from '../types/commons';
import { FsmContext, FsmEvent, FsmState } from '../types/fsm-types';
import { MarketData } from '../types/market-data';
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

function stopLoss(data: MarketData) {
  return data.price <= data.stopLoss;
}

function takeProfit(data: MarketData) {
  return data.price >= data.takeProfit;
}

export function createFsm(state: AssetStateKey, context: FsmContext) {
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
                return stopLoss(data);
              },
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
            },
            {
              target: 'NONE',
              cond: (ctx, { payload: data }) => {
                return stopLoss(data);
              },
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
                return takeProfit(data);
              },
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
            },
            {
              target: 'NONE',
              cond: (ctx, { payload: data }) => {
                return takeProfit(data);
              },
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
            },
            {
              target: 'APPROACH_TOP',
              cond: (ctx, { payload: data }) => {
                return getMarketState(data) === 'APPROACH_TOP';
              },
            },
            {
              target: 'REACH_BOTTOM',
              cond: (ctx, { payload: data }) => {
                return getMarketState(data) === 'REACH_BOTTOM';
              },
            },
            {
              target: 'APPROACH_BOTTOM',
              cond: (ctx, { payload: data }) => {
                return getMarketState(data) === 'APPROACH_BOTTOM';
              },
            },
          ],
        },
      },
    },
  });
}

export function deepTransition(state: AssetStateKey, context: FsmContext, data: MarketData) {
  // console.time('fsm');
  const fsm = createFsm(state, context);

  let curState = fsm.initialState;

  const event: FsmEvent<'update'> = {
    type: 'update',
    payload: data,
  };

  curState = fsm.transition(curState, event);
  // console.timeLog('fsm', 'transition', curState.value, curState.changed);

  let i = 0;
  while (i < 5 && curState.changed) {
    const newState = fsm.transition(curState, event);
    // console.timeLog('fsm', 'transition', newState.value, newState.changed);

    if (!newState.changed) {
      break;
    }
    curState = newState;
    i++;
  }
  // console.timeEnd('fsm');
  return curState;
}
