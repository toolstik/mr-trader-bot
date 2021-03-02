import { Module } from '@nestjs/common';

import { ListTickerScene } from './list-ticker.scene';
import { ListTickerUpdate } from './list-ticker.update';

@Module({
  imports: [],
  providers: [ListTickerUpdate, ListTickerScene],
  exports: [ListTickerUpdate, ListTickerScene],
})
export class ListTickerModule {}
