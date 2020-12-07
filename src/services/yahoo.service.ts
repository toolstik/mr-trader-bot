import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import * as moment from 'moment-timezone';
import * as yahoo from 'yahoo-finance';
import { MarketHistory, MultipleHistory, MultipleHistoryClass } from './../types/history';

type SummaryModuleKey = 'price' | 'summaryDetail' | 'financialData';

type PriceModule = {
	price: {
		regularMarketPrice: number,
	},
};
type SummaryDetailModule = {
	summaryDetail: {},
};
type FinancialDataModule = {
	financialData: {},
};

type SymbolSummary<M extends SummaryModuleKey> = {}
	& ('price' extends M ? PriceModule : {})
	& ('summaryDetail' extends M ? SummaryDetailModule : {})
	& ('financialData' extends M ? FinancialDataModule : {})

function convertDateBackToUtc(date: Date) {
	return moment.tz(date, 'America/New_York').utc(true).toDate();
}

function normalizeHistory(hist: MarketHistory) {
	hist.date = convertDateBackToUtc(hist.date);
	return hist;
}

@Injectable()
export class YahooService {

	async getHistory(symbols: string[], daysBack: number = 20) {
		const today = moment().startOf('day');
		const toDate = today.clone();
		const fromDate = toDate.clone().add({ days: -(daysBack + 10) });

		const opts = {
			symbols: symbols,
			from: fromDate.format("YYYY-MM-DD"),
			to: toDate.format("YYYY-MM-DD"),
			period: 'd',  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
		};
		const hist = await yahoo.historical(opts);
		const x = plainToClass(MultipleHistoryClass, hist, {
			targetMaps: [
				{
					target: MultipleHistoryClass,
					properties: Object.keys(hist).reduce((prev, cur) => {
						return {
							...prev,
							[cur]: MarketHistory,
						};
					}, {}),
				},
			],
		}) as MultipleHistory;
		for (const [key, val] of Object.entries(x)) {
			val.forEach(normalizeHistory);
			x[key] = val.slice(0, daysBack);
		}

		return x;
	}

	async getPrices(symbol: string) {
		const quote = await this.getQuote(symbol, ['price']);
		return quote?.price;
	}

	private async getQuote<T extends SummaryModuleKey>(
		symbol: string,
		modules: T[],
	) {
		try {
			const x: SymbolSummary<T> = await yahoo.quote(symbol, modules);
			return x;
		}
		catch (e) {
			console.error(e);
			return null;
		}

	}

}


