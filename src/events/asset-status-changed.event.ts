import { AssetStateKey } from '../types/commons';
import { MarketData } from '../types/market-data';

export class AssetStatusChangedEvent {
  static readonly event = 'asset.status.changed';

  symbol: string;
  from: AssetStateKey;
  to: AssetStateKey;
  oldPrice: number;
  oldPriceDate: Date;
  currentPrice: number;
  currentPriceDate: Date;
  marketData: MarketData;
}
