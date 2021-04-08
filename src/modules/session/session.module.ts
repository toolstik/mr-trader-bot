import { Module } from '@nestjs/common';

import { FirebaseModule } from '../firebase/firebase.module';
import { SessionRepository } from './session.repository';
import { SessionService } from './session.service';

@Module({
  imports: [FirebaseModule],
  providers: [SessionService, SessionRepository],
  exports: [SessionService, SessionRepository],
})
export class SessionModule {}
