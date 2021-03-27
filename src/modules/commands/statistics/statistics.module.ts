import { Module } from '@nestjs/common';

import { AssetModule } from '../../asset/asset.module';
import { EventModule } from '../../event/event.module';
import { StatisticsScene } from './statistics.scene';
import { StatisticsUpdate } from './statistics.update';

@Module({
  imports: [EventModule, AssetModule],
  providers: [StatisticsUpdate, StatisticsScene],
  exports: [StatisticsUpdate, StatisticsScene],
})
export class StatisticsModule {}
