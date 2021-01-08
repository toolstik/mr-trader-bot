import { Injectable } from "@nestjs/common";
import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import { AssetStatus } from '../types/commons';
import { Donchian, MarketData } from './../types/market-data';
import { AssetService } from './asset.service';
import { deepTransition } from './fsm';
import { YahooService } from './yahoo.service';

@Injectable()
export class AnalysisService {

	constructor(
		private assetService: AssetService,
		private yahooService: YahooService,
	) {
	}

	async getAssetStatus(symbol: string) {

		const [asset, marketData, fundamentals] = await Promise.all([
			this.assetService.getOne(symbol),
			this.getMarketData(symbol),
			this.assetService.getFundamentals(symbol),
		]);

		if (asset == null || marketData === null) {
			return null;
		}

		const status = deepTransition(asset.state ?? 'NONE', { asset }, marketData);

		return {
			ticker: asset.symbol,
			status: status.value,
			changed: status.changed,
			marketData,
			fundamentals,
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

		if (!donchian20 || !donchian5) {
			return null;
		}

		return {
			price: price.regularMarketPrice,
			asset: _.omit(price, 'regularMarketPrice'),
			donchian: donchian20,
			stopLoss: donchian5.minValue,
			takeProfit: donchian5.maxValue,
		} as MarketData;
	}

	private async getDonchian(symbol: string, daysBack: number) {
		const asset = await this.assetService.getOne(symbol);

		if (!asset?.history) {
			return null;
		}

		const today = moment().startOf('day').toDate().getTime();

		const donchian = asset.history
			.filter(a => a.date.getDate() < today) //before today only
			.sort((a, b) => b.date.getTime() - a.date.getTime())
			.slice(0, daysBack)
			.reduce((prev, cur) => {
				return {
					...prev,
					minValue: Math.min(prev.minValue, cur.low),
					maxValue: Math.max(prev.maxValue, cur.high),
				};
			}, {
				minDays: daysBack,
				minValue: Number.MAX_VALUE,
				maxDays: daysBack,
				maxValue: Number.MIN_VALUE,
			} as Donchian);

		return donchian;
	}

}
