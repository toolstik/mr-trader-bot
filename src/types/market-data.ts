import { PriceModule } from './../services/yahoo.service';

export type Donchian = {
	minDays: number;
	minValue: number;
	maxDays: number;
	maxValue: number;
}

export type MarketData = {
	price: number;
	asset: Omit<PriceModule, 'regularMarketPrice'>
	donchian: Donchian;
	stopLoss: number;
	takeProfit: number;
};
