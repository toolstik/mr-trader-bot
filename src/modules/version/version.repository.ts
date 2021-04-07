import { Injectable } from '@nestjs/common';
import { Transform } from 'class-transformer';

import { FirebaseRealtimeRepository } from '../../services/firebase-realtime.repository';
import { dateTo } from '../../types/commons';
import { RecordType } from '../../utils/record-transform';
import { FirebaseService } from '../firebase/firebase.service';

export class VersionInfo {
  num: number;
  description: string;
}

export class Version extends VersionInfo {
  @Transform(dateTo('string'))
  installDate: Date;
}

export class VersionEntity {
  current: number;

  @RecordType(Version)
  installed: Record<number, Version>;
}

@Injectable()
export class VersionRepository extends FirebaseRealtimeRepository<VersionEntity> {
  constructor(firebase: FirebaseService) {
    super(firebase);
  }

  protected getEntityType() {
    return VersionEntity;
  }

  protected getRefName(): string {
    return '__version';
  }
}
