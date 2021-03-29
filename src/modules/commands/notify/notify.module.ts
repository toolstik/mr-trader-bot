import { Module } from '@nestjs/common';

import { NotificationModule } from '../../notification/notification.module';
import { NotifyScene } from './notify.scene';
import { NotifyUpdate } from './notify.update';

@Module({
  imports: [NotificationModule],
  providers: [NotifyUpdate, NotifyScene],
  exports: [NotifyUpdate, NotifyScene],
})
export class NotifyModule {}
