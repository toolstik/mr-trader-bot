import { AssetStateKey } from '../types/commons';

export class AssetStatusChangedEvent {
  static readonly event = 'asset.status.changed';

  symbol: string;
  from: AssetStateKey;
  to: AssetStateKey;
  oldPrice: number;
  currentPrice: number;
}
