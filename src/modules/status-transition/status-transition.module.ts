import { Module } from '@nestjs/common';

import { FirebaseModule } from '../firebase/firebase.module';
import { StatusTransitionRepository } from './status-transition.repository';
import { StatusTransitionService } from './status-transition.service';

@Module({
  imports: [FirebaseModule],
  providers: [StatusTransitionService, StatusTransitionRepository],
  exports: [StatusTransitionService],
})
export class StatusTransitionModule {}
