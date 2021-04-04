import { Injectable } from '@nestjs/common';

import { FirebaseFirestoreRepository } from '../../services/firebase-firestore.repository';
import { AssetStateKey } from '../../types/commons';
import { FirebaseService } from '../firebase/firebase.service';

export type EventType = 'STATUS_CHANGE';
export class EventEntity {
  id: string;
  createdAt: Date;

  symbol: string;

  type: Extract<AssetStateKey, 'REACH_TOP' | 'REACH_BOTTOM'>;

  // openTime: Date;
  // closeTime: Date;
  openPrice: number;
  closePrice: number;
}

@Injectable()
export class EventRepository extends FirebaseFirestoreRepository<EventEntity> {
  constructor(firebase: FirebaseService) {
    super(firebase);
  }

  protected getEntityType() {
    return EventEntity;
  }

  protected getRefName(): string {
    return 'events';
  }
}
