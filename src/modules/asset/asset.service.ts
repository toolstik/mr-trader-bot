import { Injectable } from "@nestjs/common";
import { Transform, Type } from 'class-transformer';
import { AssetStateKey, dateTo, FundamentalData, RefEntity } from "../../types/commons";
import { MarketHistory, SymbolHistory } from "../../types/history";
import { FinvizService } from '../finviz/finviz.service';
import { FirebaseService } from "../firebase/firebase.service";
import { normalizeKey, ReferenceService } from "../../services/reference.service";
import { SessionService } from '../session/session.service';
import { YahooService } from "../yahoo/yahoo.service";
import _ = require("lodash");
import PromisePool = require("@supercharge/promise-pool/dist");

type AssetHistoryEntity = SymbolHistory;

export class AssetEntity {
	symbol: string;

	@Type(() => String)
	state: AssetStateKey;

	@Transform(dateTo('string'))
	historyUpdateAt: Date;

	@Type(() => MarketHistory)
	history: AssetHistoryEntity;
}

@Injectable()
export class AssetService extends ReferenceService<AssetEntity> {

	private readonly HISTORY_DAYS_BACK = 20;

	constructor(
		firebase: FirebaseService,
		private yahoo: YahooService,
		private finviz: FinvizService,
		private sessionService: SessionService,
	) {
		super(firebase);
	}

	protected getEntityType() {
		return AssetEntity;
	}

	protected getRefName(): string {
		return 'tickers';
	}

	async updateHistory(symbols?: string[]) {
		const symbs = symbols ?? await this.sessionService.getAllSessionTickers();

		const histories = await this.yahoo.getHistory(symbs, this.HISTORY_DAYS_BACK);
		const value = (await this.getAll()) ?? {};

		const newValue = Object.entries(histories.result || {})
			.reduce((prev, [key, val]) => {
				const normKey = normalizeKey(key);
				prev[normKey] = {
					state: 'NONE',
					symbol: key,
					...value[normKey],
					historyUpdateAt: new Date(),
					history: val,
				};
				return prev;
			}, {} as RefEntity<AssetEntity>);

		if (symbols) {
			await this.setAll({
				...value,
				...newValue,
			});
		}
		else {
			await this.setAll(newValue);
		}
		return {
			newValue,
			errors: histories.errors,
		};
	}

	async symbolsCheck(symbols: string[]) {

		const x = await PromisePool
			.withConcurrency(10)
			.for(symbols)
			.process(async symbol => {
				try {
					const price = await this.yahoo.getPrices(symbol);
					if (price.regularMarketPrice && price.postMarketSource !== 'DELAYED') {
						return {
							success: [symbol],
						};
					} else {
						return {
							error: [symbol],
						};
					}
				}
				catch{
					return {
						error: [symbol],
					};
				}
			})
			.then(r => {
				return r.results.reduce((prev, cur) => {
					return {
						success: [...prev.success, ...(cur.success || [])],
						error: [...prev.error, ...(cur.error || [])],
					}
				}, {
					success: [] as string[],
					error: [] as string[],
				})
			});

		return x;

	}

	async getFundamentals(symbol: string) {
		const [yh, fv] = await Promise.all([
			this.yahoo.getFundamentals(symbol),
			this.finviz.fetchData(symbol),
		]);

		return {
			ticker: symbol,
			trailingPE: yh.trailingPE,
			priceToBook: yh.priceToBook,
			priceToSales: yh.priceToSalesTrailing12Months,
			trailingEps: yh.trailingEps,
			currentRatio: yh.currentRatio,
			dividentAnnualPercent: yh.trailingAnnualDividendYield * 100,
			sma50: yh.fiftyDayAverage,
			sma200: yh.twoHundredDayAverage,
			rsi14: fv?.rsi14,
		} as FundamentalData;
	}

}
