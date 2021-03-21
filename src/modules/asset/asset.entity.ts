import { Transform, Type } from 'class-transformer';

import { AssetStateKey, dateTo } from '../../types/commons';
import { MarketHistory, SymbolHistory } from '../../types/history';

export class AssetEntity {
  symbol: string;

  @Type(() => String)
  state: AssetStateKey;

  stateData: {
    enterTimestamp: Date;
    enterPrice: number;
  };

  @Transform(dateTo('string'))
  historyUpdateAt: Date;

  @Type(() => MarketHistory)
  history: SymbolHistory;
}
