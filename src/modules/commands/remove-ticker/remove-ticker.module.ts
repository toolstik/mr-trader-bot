import { Module } from '@nestjs/common';

import { AssetModule } from '../../asset/asset.module';
import { YahooModule } from '../../yahoo/yahoo.module';
import { RemoveTickerScene } from './remove-ticker.scene';
import { RemoveTickerUpdate } from './remove-ticker.update';

@Module({
  imports: [AssetModule, YahooModule],
  providers: [RemoveTickerUpdate, RemoveTickerScene],
  exports: [RemoveTickerUpdate, RemoveTickerScene],
})
export class RemoveTickerModule {}
