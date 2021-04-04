import { Module } from '@nestjs/common';

import { AssetModule } from '../../asset/asset.module';
import { EventModule } from '../../event/event.module';
import { StatusTransitionModule } from '../../status-transition/status-transition.module';
import { StatisticsScene } from './statistics.scene';
import { StatisticsService } from './statistics.service';
import { StatisticsUpdate } from './statistics.update';

@Module({
  imports: [EventModule, AssetModule, StatusTransitionModule],
  providers: [StatisticsUpdate, StatisticsScene, StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
