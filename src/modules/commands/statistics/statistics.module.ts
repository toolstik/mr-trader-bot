import { Module } from '@nestjs/common';

import { EventModule } from '../../event/event.module';
import { StatisticsScene } from './statistics.scene';
import { StatisticsUpdate } from './statistics.update';

@Module({
  imports: [EventModule],
  providers: [StatisticsUpdate, StatisticsScene],
  exports: [StatisticsUpdate, StatisticsScene],
})
export class StatisticsModule {}
