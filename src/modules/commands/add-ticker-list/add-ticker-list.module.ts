import { Module } from '@nestjs/common';

import { AssetModule } from '../../asset/asset.module';
import { AssetListModule } from '../../asset-list/asset-list.module';
import { AddTickerListScene } from './add-ticker-list.scene';
import { AddTickerListUpdate } from './add-ticker-list.update';

@Module({
  imports: [AssetModule, AssetListModule],
  providers: [AddTickerListUpdate, AddTickerListScene],
  exports: [AddTickerListUpdate, AddTickerListScene],
})
export class AddTickerListModule {}
