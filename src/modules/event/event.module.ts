import { Module } from '@nestjs/common';

import { FirebaseModule } from '../firebase/firebase.module';
import { SessionModule } from '../session/session.module';
import { EventRepository } from './event.repository';
import { EventService } from './event.service';

@Module({
  imports: [FirebaseModule, SessionModule],
  providers: [EventService, EventRepository],
  exports: [EventService],
})
export class EventModule {}
