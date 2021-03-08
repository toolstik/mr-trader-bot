import { Injectable } from '@nestjs/common';

import { FirebaseRealtimeRepository } from '../../services/firebase-realtime.repository';
import { TgSession } from '../../types/my-context';
import { FirebaseService } from '../firebase/firebase.service';

export class SessionEntity {
  [key: string]: TgSession;
}

@Injectable()
export class SessionRepository extends FirebaseRealtimeRepository<SessionEntity> {
  protected getEntityType() {
    return SessionEntity;
  }

  constructor(firebase: FirebaseService) {
    super(firebase);
  }

  protected getRefName(): string {
    return 'sessions';
  }
}
