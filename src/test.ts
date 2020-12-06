import { createMachine } from '@xstate/fsm';
const APPROACH_RATE = 0.005;

type Donchian = {
	min: number;
	max: number;
}

type MarketData = {
	price: number;
	donchian: Donchian;
	stopLoss: number;
	takeProfit: number;
};

type FsmContext = {
	marketData: MarketData;
}

type _FsmEvent<K extends string, T> = {
	type: K;
	payload: T;
};
type FsmEventKey = 'update' | 'reset';
type FsmEventPayload<K extends FsmEventKey> =
	'update' extends K ? MarketData :
	'reset' extends K ? {} :
	never;

type FsmEvent<K extends FsmEventKey = any> = _FsmEvent<K, FsmEventPayload<K>>;


type _FsmState<K extends string, T extends FsmContext> = {
	value: K,
	context: T,
};

type FsmStateKey = 'NONE' | 'APPROACH_TOP' | 'APPROACH_BOTTOM' | 'REACH_TOP' | 'REACH_BOTTOM';
type FsmState = _FsmState<FsmStateKey, FsmContext>

type EventConfig = {
	[K in FsmEventKey]: (state: FsmState, payload: FsmEventPayload<K>) => FsmState;
}

function getMarketState(data: MarketData): FsmStateKey {

	if (data.price >= data.donchian.max) {
		return 'REACH_TOP';
	}

	if (data.price * (1 + APPROACH_RATE) >= data.donchian.max) {
		return 'APPROACH_TOP';
	}

	if (data.price <= data.donchian.min) {
		return 'REACH_BOTTOM';
	}

	if (data.price * (1 - APPROACH_RATE) <= data.donchian.min) {
		return 'APPROACH_BOTTOM';
	}

	return 'NONE';
}

function stopLoss(data: MarketData) {
	return data.price <= data.stopLoss;
}

function takeProfit(data: MarketData) {
	return data.price >= data.takeProfit;
}

const fsm = createMachine<FsmContext, FsmEvent, FsmState>({
	initial: 'NONE',
	states: {
		REACH_TOP: {
			on: {
				update: [
					{
						target: 'NONE',
						cond: (ctx, { payload: data }) => {
							return stopLoss(data);
						},
					},
				],
			},
		},
		APPROACH_TOP: {
			on: {
				update: [
					{
						target: 'REACH_TOP',
						cond: (ctx, { payload: data }) => {
							return getMarketState(data) === 'REACH_TOP';
						},
					},
					{
						target: 'NONE',
						cond: (ctx, { payload: data }) => {
							return stopLoss(data);
						},
					},
				],
			},
		},
		REACH_BOTTOM: {
			on: {
				update: [
					{
						target: 'NONE',
						cond: (ctx, { payload: data }) => {
							return takeProfit(data);
						},
					},
				],
			},
		},
		APPROACH_BOTTOM: {
			on: {
				update: [
					{
						target: 'REACH_BOTTOM',
						cond: (ctx, { payload: data }) => {
							return getMarketState(data) === 'REACH_BOTTOM';
						},
					},
					{
						target: 'NONE',
						cond: (ctx, { payload: data }) => {
							return takeProfit(data);
						},
					},
				],
			},
		},
		NONE: {
			on: {
				update: [
					{
						target: 'REACH_TOP',
						cond: (ctx, { payload: data }) => {
							return getMarketState(data) === 'REACH_TOP';
						},
					},
					{
						target: 'APPROACH_TOP',
						cond: (ctx, { payload: data }) => {
							return getMarketState(data) === 'APPROACH_TOP';
						},
					},
					{
						target: 'REACH_BOTTOM',
						cond: (ctx, { payload: data }) => {
							return getMarketState(data) === 'REACH_BOTTOM';
						},
					},
					{
						target: 'APPROACH_BOTTOM',
						cond: (ctx, { payload: data }) => {
							return getMarketState(data) === 'APPROACH_BOTTOM';
						},
					},
				],
			},
		},
	},
});


async function test() {

	const event: FsmEvent<'update'> = {
		type: 'update',
		payload: {
			price: 89.99,
			donchian: {
				min: 50,
				max: 90,
			},
			stopLoss: 70,
			takeProfit: 80,
		},
	}

	const x = fsm.transition('NONE', event);
	const y = fsm.transition(x, event);
	console.log(x);
	console.log(y);
}

void test();


