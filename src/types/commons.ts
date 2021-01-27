import { MarketData } from "./market-data";

export type AssetStateKey = 'NONE' | 'APPROACH_TOP' | 'APPROACH_BOTTOM' | 'REACH_TOP' | 'REACH_BOTTOM';

export type AssetStatus = {
	ticker: string;
	status: AssetStateKey;
	changed: boolean;
	marketData: MarketData;
};

export type AssetStatusWithFundamentals = AssetStatus & {
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

export type Page<T> = {
	pageNum: number;
	pageSize: number;
	totalPages: number;
	totalItems: number;
	items: T[];
};

export function paginate<T>(array: T[], size = 15): Page<T>[] {
	return array?.reduce((acc, val, i) => {
		const idx = Math.floor(i / size);
		const page = acc[idx] || (acc[idx] = []);
		page.push(val);
		return acc;
	}, [] as T[][])
		.map((p, i, a) => {
			return {
				pageNum: i + 1,
				pageSize: p.length,
				totalPages: a.length,
				totalItems: array.length,
				items: p,
			} as Page<T>;
		});
}

type ArrayItem<T> = T extends (infer R)[] ? R :
	T extends readonly (infer R)[] ? R :
	never;
export const KnownListKeys = ['nasdaq', 'snp500'] as const;
export type ListKey = ArrayItem<typeof KnownListKeys>;
