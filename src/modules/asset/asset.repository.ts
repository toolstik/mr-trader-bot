import { Injectable } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';

import { FirebaseRealtimeRepository } from '../../services/firebase-realtime.repository';
import { AssetStateKey, dateTo } from '../../types/commons';
import { MarketHistory, SymbolHistory } from '../../types/history';
import { FirebaseService } from '../firebase/firebase.service';

type AssetHistoryEntity = SymbolHistory;

export class AssetEntity {
  symbol: string;

  @Type(() => String)
  state: AssetStateKey;

  @Transform(dateTo('string'))
  historyUpdateAt: Date;

  @Type(() => MarketHistory)
  history: AssetHistoryEntity;
}

@Injectable()
export class AssetRepository extends FirebaseRealtimeRepository<AssetEntity> {
  constructor(firebase: FirebaseService) {
    super(firebase);
  }

  protected getEntityType() {
    return AssetEntity;
  }

  protected getRefName(): string {
    return 'tickers';
  }
}
