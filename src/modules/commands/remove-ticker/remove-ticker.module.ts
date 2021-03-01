import { Module } from '@nestjs/common';

import { RemoveTickerScene } from './remove-ticker.scene';
import { RemoveTickerUpdate } from './remove-ticker.update';

@Module({
  imports: [],
  providers: [RemoveTickerUpdate, RemoveTickerScene],
  exports: [RemoveTickerUpdate, RemoveTickerScene],
})
export class RemoveTickerModule {}
