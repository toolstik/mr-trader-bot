import { FirebaseService } from './firebase.service';
import { Injectable } from "@nestjs/common";
import { database } from 'firebase-admin';
import _ = require('lodash');
import { Session } from '../bot/my-context';
import { FinanceService, SymbolHistory } from './finance.service';

type RefEntity<T> = Record<string, T>;

type TickerHistoryEntity = SymbolHistory;

type TickerEntity = {
	symbol: string;
	history: TickerHistoryEntity;
};

type SessionEntity<C extends string = any> = {
	[key in C]: Session;
}

type RefNames = 'sessions' | 'tickers';

type RefEntityType<T extends RefNames> =
	'tickers' extends T ? TickerEntity :
	'sessions' extends T ? SessionEntity :
	never;

@Injectable()
export class StorageService {
	private readonly db: database.Database;

	constructor(firebase: FirebaseService, private finance: FinanceService) {
		this.db = firebase.getDatabase();
	}

	private async getRefValue<T extends RefNames>(ref: T) {
		return (await this.db.ref(ref).once('value')).val() as RefEntity<RefEntityType<T>>;
	}

	private async getRefItemValue<T extends RefNames>(ref: RefNames, key: string) {
		return (await this.db.ref(ref).child(key).once('value')).val() as RefEntityType<T>;
	}

	async getSessions() {
		const sessionRefValue = await this.getRefValue('sessions');
		return _.flatten(Object.values(sessionRefValue).map(sv => Object.values(sv)));
	}

	async updateTickersHistory(daysBack: number) {
		const sessions = await this.getSessions();
		const symbols = _.uniq(_.flatten(sessions.map(s => s.subscriptionTickers)));
		const histories = await this.finance.getHistory(symbols, daysBack);

		const value = await this.getRefValue('tickers');
		const newValue = Object.entries(histories)
			.reduce((prev, [key, val]) => {
				prev[key] = {
					...value[key],
					symbol: key,
					history: val,
				};
				return prev;
			}, {} as RefEntity<TickerEntity>);

		await this.db.ref('tickers').set(newValue);
		return newValue;
	}

	async getTickerData(symbol: string) {
		return await this.getRefItemValue('tickers', symbol);
	}

}