import { SessionService } from './session.service';
import { Injectable } from "@nestjs/common";
import _ = require("lodash");
import { FirebaseService } from "./firebase.service";
import { RefEntity, ReferenceService } from "./reference.service";
import { SymbolHistory, YahooService } from "./yahoo.service";

type TickerHistoryEntity = SymbolHistory;

type TickerEntity = {
	symbol: string;
	history: TickerHistoryEntity;
};

@Injectable()
export class AssetService extends ReferenceService<TickerEntity> {

	constructor(
		firebase: FirebaseService,
		private finance: YahooService,
		private sessionService: SessionService,
		) {
		super(firebase);
	}

	protected getRefName(): string {
		return 'tickers';
	}

	async updateHistoryAll(daysBack: number) {
		const sessions = await this.sessionService.getSessions();
		const symbols = _.uniq(_.flatten(sessions.map(s => s.subscriptionTickers)));
		const histories = await this.finance.getHistory(symbols, daysBack);

		const value = await this.getAll();
		const newValue = Object.entries(histories)
			.reduce((prev, [key, val]) => {
				prev[key] = {
					...value[key],
					history: val,
				};
				return prev;
			}, {} as RefEntity<TickerEntity>);

		await this.setAll(newValue);
		return newValue;
	}

}
