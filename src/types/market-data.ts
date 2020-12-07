
export type Donchian = {
	min: number;
	max: number;
}

export type MarketData = {
	price: number;
	donchian: Donchian;
	stopLoss: number;
	takeProfit: number;
};
