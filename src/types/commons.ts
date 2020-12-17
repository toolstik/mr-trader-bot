import { TgSession } from './my-context';
import { MarketData } from "./market-data";

export type AssetStateKey = 'NONE' | 'APPROACH_TOP' | 'APPROACH_BOTTOM' | 'REACH_TOP' | 'REACH_BOTTOM';

export type AssetStatus = {
	ticker: string;
	status: AssetStateKey;
	changed: boolean;
	marketData: MarketData;
};

export type RefEntity<T> = Record<string, T>;

export class RefEntityObject {
	[key: string]: Object;
}
