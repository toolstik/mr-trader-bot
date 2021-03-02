import { Module } from '@nestjs/common';

import { AssetModule } from '../asset/asset.module';
import { YahooModule } from '../yahoo/yahoo.module';
import { AnalysisService } from './analysis.service';

@Module({
  imports: [AssetModule, YahooModule],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
