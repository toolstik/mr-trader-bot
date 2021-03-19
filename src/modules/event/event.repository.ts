import { Injectable } from '@nestjs/common';
import { Type } from 'class-transformer';

import { FirebaseFirestoreRepository } from '../../services/firebase-firestore.repository';
import { AssetStateKey } from '../../types/commons';
import { FirebaseService } from '../firebase/firebase.service';

export class EventEntity {
  timestamp: Date;

  @Type(() => String)
  state: AssetStateKey;
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
