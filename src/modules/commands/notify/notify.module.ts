import { Module } from '@nestjs/common';

import { NotificationModule } from '../../notification/notification.module';
import { TestTickerScene } from './notify.scene';
import { NotifyUpdate } from './notify.update';

@Module({
  imports: [NotificationModule],
  providers: [NotifyUpdate, TestTickerScene],
  exports: [NotifyUpdate, TestTickerScene],
})
export class NotifyModule {}
