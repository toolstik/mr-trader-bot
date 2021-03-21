import { Injectable } from '@nestjs/common';

import { FirebaseRealtimeRepository } from '../../services/firebase-realtime.repository';
import { FirebaseService } from '../firebase/firebase.service';
import { AssetEntity } from './asset.entity';

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
