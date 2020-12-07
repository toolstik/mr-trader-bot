import { Transform } from "class-transformer";
import { TransformationType } from "class-transformer/enums";

export class MarketHistory {

	@Transform((val, obj, type) => {
		if (type === TransformationType.PLAIN_TO_CLASS) {
			if (typeof val !== 'object') {
				return new Date(val);
			}
			return val;
		}

		if (type === TransformationType.CLASS_TO_PLAIN) {
			if (val instanceof Date) {
				return val.getTime();
			}
			return val;
		}

		return val;
	})
	date: Date;
	open: number;
	high: number;
	low: number;
	close: number;
	adjClose: number;
	volume: number;
	symbol: string;
}

export type SymbolHistory = MarketHistory[];

export type MultipleHistory = Record<string, SymbolHistory>;

export class MultipleHistoryClass {
	[key: string]: Object;
}

