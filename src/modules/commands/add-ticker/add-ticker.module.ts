import { Module } from '@nestjs/common';
import { AssetModule } from '../../asset/asset.module';
import { YahooModule } from '../../yahoo/yahoo.module';
import { AddTickerScene } from './add-ticker.scene';
import { AddTickerUpdate } from './add-ticker.update';

@Module({
	imports: [
		AssetModule,
		YahooModule,
	],
	providers: [
		AddTickerUpdate, AddTickerScene,
	],
	exports: [
		AddTickerUpdate, AddTickerScene,
	],
})
export class AddTickerModule { }
