import { Injectable } from '@nestjs/common';

import { FirebaseFirestoreRepository } from '../../services/firebase-firestore.repository';
import { AssetStateKey } from '../../types/commons';
import { FirebaseService } from '../firebase/firebase.service';

export type EventType = 'STATUS_CHANGE';

export type StatusChangeType = Exclude<AssetStateKey, 'NONE'> | 'STOP_TOP' | 'STOP_BOTTOM';

export class StatusChangeData {
  symbol: string;
  statusChangeType: StatusChangeType;
  oldStatus: AssetStateKey;
  newStatus: AssetStateKey;
  currentPrice: number;
  linkedEvent?: EventEntity;
}

export class EventEntity {
  id: string;
  timestamp: Date;

  symbol: string;

  oldStatus: AssetStateKey;
  newStatus: AssetStateKey;
  oldPrice: number;
  newPrice: number;
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
