import { Transform, Type } from 'class-transformer';

import { AssetStateKey, dateTo } from '../../types/commons';
import { MarketHistory, SymbolHistory } from '../../types/history';

class AssetStateData {
  @Transform(dateTo('string'))
  enterTimestamp: Date;

  enterPrice: number;
}
export class AssetEntity {
  symbol: string;

  @Type(() => String)
  state: AssetStateKey;

  @Type(() => AssetStateData)
  stateData: AssetStateData;

  @Transform(dateTo('string'))
  historyUpdateAt: Date;

  @Type(() => MarketHistory)
  history: SymbolHistory;
}
