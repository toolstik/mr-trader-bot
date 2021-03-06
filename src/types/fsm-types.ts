import { StateMachine } from '@xstate/fsm';

import { AssetStatusChangedEvent } from '../events/asset-status-changed.event';
import { AssetEntity } from '../modules/asset/asset.entity';
import { AssetStateKey } from './commons';
import { MarketData } from './market-data';

export type FsmContext = {
  asset: AssetEntity;
  events?: AssetStatusChangedEvent[];
};

type _FsmEvent<K extends string, T> = {
  type: K;
  payload: T;
};
export type FsmEventKey = 'update' | 'reset';
export type FsmEventPayload<K extends FsmEventKey> = 'update' extends K
  ? MarketData
  : 'reset' extends K
  ? {}
  : never;

type _FsmState<K extends string, T extends FsmContext> = {
  value: K;
  context: T;
};

export type FsmState = _FsmState<AssetStateKey, FsmContext>;

export type FsmEvent<K extends FsmEventKey = any> = _FsmEvent<K, FsmEventPayload<K>>;

export type State = StateMachine.State<FsmContext, FsmEvent, FsmState>;
