import { Injectable } from '@nestjs/common';
import * as moment from 'moment-timezone';
import * as yahoo from 'yahoo-finance';

type SummaryModuleKey = 'price' | 'summaryDetail' | 'financialData';

type PriceModule = {
	price: {},
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

type History = {
	date: Date;
	open: number;
	high: number;
	low: number;
	close: number;
	adjClose: number;
	volume: number;
	symbol: string;
}

export type SymbolHistory = History[];

type MultipleHistory = Record<string, SymbolHistory>;

function convertDateBackToUtc(date: Date) {
	return moment.tz(date, 'America/New_York').utc(true).toDate();
}

function normalizeHistory(hist: History) {
	hist.date = convertDateBackToUtc(hist.date);
	return hist;
}

@Injectable()
export class FinanceService {

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
		const x: MultipleHistory = await yahoo.historical(opts);

		for (const [key, val] of Object.entries(x)) {
			val.forEach(normalizeHistory);
			x[key] = val.slice(0, daysBack);
		}

		return x;
	}

	async getSummary<T extends SummaryModuleKey>(
		symbol: string,
		modules: T[] = ['price' as any],
	) {
		const x: SymbolSummary<T> = await yahoo.quote(symbol, modules);
		return x;
	}
	
}


