import { Injectable } from '@nestjs/common';

import { AssetStatusChangedEvent } from '../../events/asset-status-changed.event';
import { FirebaseFirestoreRepository } from '../../services/firebase-firestore.repository';
import { FirebaseService } from '../firebase/firebase.service';

export class StatusTransitionEntity {
  id: string;
  createdAt: Date;

  event: AssetStatusChangedEvent;
}

@Injectable()
export class StatusTransitionRepository extends FirebaseFirestoreRepository<StatusTransitionEntity> {
  constructor(firebase: FirebaseService) {
    super(firebase);
  }

  protected getEntityType() {
    return StatusTransitionEntity;
  }

  protected getRefName(): string {
    return 'transitions';
  }
}
