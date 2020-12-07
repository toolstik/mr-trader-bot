import { MarketData, Donchian } from './../types/market-data';
import { YahooService } from './yahoo.service';
import { AssetService } from './asset.service';
import { Injectable } from "@nestjs/common";
import { recursiveUpdateTransition, FsmStateKey } from './fsm';
import * as _ from 'lodash';

export type AssetStatus = {
	ticker: string;
	status: FsmStateKey;
	changed: boolean;
	marketData: MarketData;
};

@Injectable()
export class AnalysisService {

	constructor(
		private assetService: AssetService,
		private yahooService: YahooService,
	) {
	}

	async getAssetStatus(symbol: string) {
		const asset = await this.assetService.getOne(symbol);
		const marketData = await this.getMarketData(symbol);

		if (asset == null || marketData === null) {
			return null;
		}

		const status = recursiveUpdateTransition(asset.state ?? 'NONE', { marketData }, marketData);
		return {
			ticker: asset.symbol,
			status: status.value,
			changed: status.changed,
			marketData: marketData,
		} as AssetStatus
	}

	private async getMarketData(symbol: string) {
		const price = await this.yahooService.getPrices(symbol);
		// console.log(symbol, price);
		if (!price?.regularMarketPrice) {
			return null;
		}

		const donchian20 = await this.getDonchian(symbol, 20);
		const donchian5 = await this.getDonchian(symbol, 5);
		return {
			price: price.regularMarketPrice,
			donchian: donchian20,
			stopLoss: donchian5.max,
			takeProfit: donchian5.min,
		} as MarketData;
	}

	private async getDonchian(symbol: string, daysBack: number) {
		const asset = await this.assetService.getOne(symbol);
		// console.log(asset);
		const donchian = asset.history
			.sort((a, b) => b.date.getTime() - a.date.getTime())
			.slice(0, daysBack)
			.reduce((prev, cur) => {
				return {
					min: Math.min(prev.min, cur.low),
					max: Math.max(prev.max, cur.high),
				};
			}, {
				min: Number.MAX_VALUE,
				max: Number.MIN_VALUE,
			} as Donchian);

		return donchian;
	}

}
