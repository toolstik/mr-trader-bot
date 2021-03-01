import { Module } from '@nestjs/common';

import { AssetModule } from '../../asset/asset.module';
import { NotificationModule } from '../../notification/notification.module';
import { FundamentalsScene } from './fundamentals.scene';
import { FundamentalsUpdate } from './fundamentals.update';

@Module({
  imports: [AssetModule, NotificationModule],
  providers: [FundamentalsUpdate, FundamentalsScene],
  exports: [FundamentalsUpdate, FundamentalsScene],
})
export class FundamentalsModule {}
