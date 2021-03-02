import { Module } from '@nestjs/common';

import { AssetListModule } from '../../asset-list/asset-list.module';
import { RemoveTickerListScene } from './remove-ticker-list.scene';
import { RemoveTickerListUpdate } from './remove-ticker-list.update';

@Module({
  imports: [AssetListModule],
  providers: [RemoveTickerListUpdate, RemoveTickerListScene],
  exports: [RemoveTickerListUpdate, RemoveTickerListScene],
})
export class RemoveTickerListModule {}
