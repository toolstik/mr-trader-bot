import { Module } from '@nestjs/common';

import { AssetModule } from '../../asset/asset.module';
import { YahooModule } from '../../yahoo/yahoo.module';
import { ListTickerScene } from './list-ticker.scene';
import { ListTickerUpdate } from './list-ticker.update';

@Module({
  imports: [AssetModule, YahooModule],
  providers: [ListTickerUpdate, ListTickerScene],
  exports: [ListTickerUpdate, ListTickerScene],
})
export class ListTickerModule {}
