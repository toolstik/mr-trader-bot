import { Module } from '@nestjs/common';

import { AssetModule } from '../../asset/asset.module';
import { UpdateHistoryScene } from './update-history.scene';
import { UpdateHistoryUpdate } from './update-history.update';

@Module({
  imports: [AssetModule],
  providers: [UpdateHistoryUpdate, UpdateHistoryScene],
  exports: [UpdateHistoryUpdate, UpdateHistoryScene],
})
export class UpdateHistoryModule {}
