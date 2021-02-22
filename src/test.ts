import { DatahubService } from './services/datahub.service';
import { YahooService } from './modules/yahoo/yahoo.service';
import { TemplateService } from './services/template.service';
import { BotService } from './services/bot.service';
import { AnalysisService } from './services/analysis.service';
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as path from 'path';

// import { Finviz, FinVizObject, FinVizAttribute } from 'ts-finviz/lib';
import Axios from 'axios';
import { FundamentalData } from './types/commons';

// async function fetchAllFinvizData(ticker: string): Promise<FinVizObject> {
// 	try {
// 		console.time(ticker);
// 		return Finviz.getStockData(ticker);
// 	} finally {
// 		console.timeEnd(ticker);
// 	}
// }


function normalizeKey(key: string) {
	return key ? key.replace(/[.#$/\[\]]/, '_') : key;
}

function splitLimit(input: string, splitter: string, limit: number = -1) {
	if (limit === 0) {
		return [input];
	}

	const index = input.indexOf(splitter);

	if (index < 0) {
		return [input];
	}

	const head = input.slice(0, index);
	const tail = input.slice(index + splitter.length);

	return [head, ...splitLimit(tail, splitter, limit - 1)];
}

async function test1() {
	const app = await NestFactory.createApplicationContext(AppModule);
	const module = app.select(AppModule);

	const a = module.get(TemplateService);
	const x = a.apply('test/template', { data: 'HELLO!' });
	console.log(x);
	// const y = await a.prepareNotifications();
	// console.log(y);
}

// async function test2() {
// 	await fetchAllFinvizData('AAPL');
// 	await fetchAllFinvizData('LSI');
// 	await fetchAllFinvizData('LSI');
// 	await fetchAllFinvizData('LSI');
// 	await fetchAllFinvizData('LSI');
// 	// console.log(x);
// }

async function alphavantage(symbol: string) {
	console.time(symbol);
	const x = await Axios.get(`https://www.alphavantage.co/query?function=${symbol}&symbol=LSI&interval=daily&time_period=14&series_type=close&apikey=DNY0RDWTLM8204BC`);
	console.timeEnd(symbol);
	return x.data;
}

async function test3() {

	await alphavantage('LSI');
	await alphavantage('AAPL');
	await alphavantage('TSLA');
}

async function test4() {
	const yahoo = new YahooService();
	const x = await yahoo.getFundamentals('AAPL');

	const y = {
		trailingPE: x.trailingPE,
		priceToBook: x.priceToBook,
		priceToSales: x.priceToSalesTrailing12Months,
		trailingEps: x.trailingEps,
		currentRatio: x.currentRatio,
		dividentAnnualPercent: x.trailingAnnualDividendYield,
		sma50: x.fiftyDayAverage,
		sma200: x.twoHundredDayAverage,
		rsi13: null,
	} as FundamentalData;
	console.log(x);
}

async function test5() {
	const yahoo = new YahooService();
	const datahub = new DatahubService();
	const list = await datahub.getSnP500List();
	const x = await yahoo.getHistory(list);
	console.time('test5');
	console.dir(x.errors, { 'maxArrayLength': null });
	console.timeEnd('test5');
}

async function test6() {
	const yahoo = new YahooService();
	const data = await yahoo.getPrices('AAVL');
	console.dir(data, { 'maxArrayLength': null });
}

async function test() {

	await test5();
	// console.log(normalizeKey('GAZP.ME'));
	// console.log(splitLimit('level1/level2/level3', '/'));
	// console.log(path.relative('level1', 'level1/level2/level3').replace(/\\/, '/'));
}





void test();


