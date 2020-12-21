import { Injectable } from "@nestjs/common";
import { Type } from 'class-transformer';
import { AssetStateKey, RefEntity, FundamentalData } from "../types/commons";
import { MarketHistory, SymbolHistory } from "../types/history";
import { FirebaseService } from "./firebase.service";
import { normalizeKey, ReferenceService } from "./reference.service";
import { SessionService } from './session.service';
import { YahooService } from "./yahoo.service";
import _ = require("lodash");

type AssetHistoryEntity = SymbolHistory;

export class AssetEntity {
	symbol: string;

	@Type(() => String)
	state: AssetStateKey;

	@Type(() => MarketHistory)
	history: AssetHistoryEntity;
}

@Injectable()
export class AssetService extends ReferenceService<AssetEntity> {

	private readonly HISTORY_DAYS_BACK = 20;

	constructor(
		firebase: FirebaseService,
		private yahoo: YahooService,
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

		const newValue = Object.entries(histories)
			.reduce((prev, [key, val]) => {
				const normKey = normalizeKey(key);
				prev[normKey] = {
					state: 'NONE',
					symbol: key,
					...value[normKey],
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
		return newValue;
	}

	async getFundamentals(symbol: string) {
		const x = await this.yahoo.getFundamentals(symbol);

		return {
			ticker: symbol,
			trailingPE: x.trailingPE,
			priceToBook: x.priceToBook,
			priceToSales: x.priceToSalesTrailing12Months,
			trailingEps: x.trailingEps,
			currentRatio: x.currentRatio,
			dividentAnnualPercent: x.trailingAnnualDividendYield * 100,
			sma50: x.fiftyDayAverage,
			sma200: x.twoHundredDayAverage,
			rsi13: null,
		} as FundamentalData;
	}

}
