
export type Donchian = {
	minDays: number;
	minValue: number;
	maxDays: number;
	maxValue: number;
}

export type MarketData = {
	price: number;
	donchian: Donchian;
	stopLoss: number;
	takeProfit: number;
};
