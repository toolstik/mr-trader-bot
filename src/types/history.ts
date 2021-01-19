import { Transform, TransformationType } from "class-transformer";

export class MarketHistory {

	@Transform(({value, obj, type}) => {
		if (type === TransformationType.PLAIN_TO_CLASS) {
			if (typeof value !== 'object') {
				return new Date(value);
			}
			return value;
		}

		if (type === TransformationType.CLASS_TO_PLAIN) {
			if (value instanceof Date) {
				return value.getTime();
			}
			return value;
		}

		return value;
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

