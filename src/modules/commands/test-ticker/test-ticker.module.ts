import { Module } from '@nestjs/common';

import { AnalysisModule } from '../../analysis/analysis.module';
import { NotificationModule } from '../../notification/notification.module';
import { TestTickerScene } from './test-ticker.scene';
import { TestTickerUpdate } from './test-ticker.update';

@Module({
  imports: [AnalysisModule, NotificationModule],
  providers: [TestTickerUpdate, TestTickerScene],
  exports: [TestTickerUpdate, TestTickerScene],
})
export class TestTickerModule {}
