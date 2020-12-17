import { Injectable } from "@nestjs/common";
import { Type } from 'class-transformer';
import { AssetStateKey, RefEntity } from "../types/commons";
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
		private finance: YahooService,
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
		const histories = await this.finance.getHistory(symbs, this.HISTORY_DAYS_BACK);

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

}
