import { Module } from '@nestjs/common';

import { FirebaseModule } from '../firebase/firebase.module';
import { SessionModule } from '../session/session.module';
import { VersionRepository } from './version.repository';
import { VersionService } from './version.service';

@Module({
  imports: [FirebaseModule, SessionModule],
  providers: [VersionService, VersionRepository],
  exports: [VersionService],
})
export class VersionModule {}
