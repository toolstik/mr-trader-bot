import { Module } from '@nestjs/common';

import { NotificationModule } from '../../notification/notification.module';
import { StatusScene } from './status.scene';
import { StatusUpdate } from './status.update';

@Module({
  imports: [NotificationModule],
  providers: [StatusUpdate, StatusScene],
  exports: [StatusUpdate, StatusScene],
})
export class StatusModule {}
