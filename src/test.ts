import * as yahoo from 'yahoo-finance';
import * as moment from 'moment-timezone';
import * as _ from 'lodash';

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

type SymbolHistory = History[];

type MultipleHistory = Record<string, SymbolHistory>;

function convertDateBackToUtc(date: Date) {
	return moment.tz(date, 'America/New_York').utc(true).toDate();
}

function normalizeHistory(hist: History) {
	hist.date = convertDateBackToUtc(hist.date);
	return hist;
}

async function getHistory(symbols: string[], daysBack: number = 20) {
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

async function getSummary<T extends SummaryModuleKey>(
	symbol: string,
	modules: T[] = ['price' as any],
): Promise<SymbolSummary<T>> {
	const x = await yahoo.quote(symbol, modules);
	return x;
}

async function test() {
	// const { data } = await axios.get<Ticker[]>('https://api.iextrading.com/1.0/tops/last?symbols=TSLA');

	// const x = await getHistory(['AAPL']);
	const x = await getSummary('AAPL', ['price', 'financialData']);
	console.log(x);

	// console.log(new Date().getTime(), new Date('2020-11-25').getTime());
}

void test();


