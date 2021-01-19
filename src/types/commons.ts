import { MarketData } from "./market-data";

export type AssetStateKey = 'NONE' | 'APPROACH_TOP' | 'APPROACH_BOTTOM' | 'REACH_TOP' | 'REACH_BOTTOM';

export type AssetStatus = {
	ticker: string;
	status: AssetStateKey;
	changed: boolean;
	marketData: MarketData;
	fundamentals: FundamentalData,
};

export type RefEntity<T> = Record<string, T>;

export class RefEntityObject {
	[key: string]: Object;
}

export type FundamentalData = {
	ticker: string;
	trailingPE: number;
	priceToBook: number;
	priceToSales: number;
	trailingEps: number;
	currentRatio: number;
	dividentAnnualPercent: number;
	sma50: number;
	sma200: number;
	rsi13: number;
	rsi14: number;

}

type ArrayItem<T> = T extends (infer R)[] ? R :
	T extends readonly (infer R)[] ? R :
	never;
export const KnownListKeys = ['nasdaq', 'snp500'] as const;
export type ListKey = ArrayItem<typeof KnownListKeys>;
