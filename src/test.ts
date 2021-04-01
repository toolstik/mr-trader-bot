import { Test } from '@nestjs/testing';
import Axios from 'axios';
import { plainToClass } from 'class-transformer';
import * as admin from 'firebase-admin';
import moment = require('moment');

import { AppModule } from './app.module';
import { AssetEntity } from './modules/asset/asset.entity';
import { AssetService } from './modules/asset/asset.service';
import { flatMerge } from './modules/commands/utils';
import { DatahubService } from './modules/datahub/datahub.service';
import { FirebaseService } from './modules/firebase/firebase.service';
import { YahooService } from './modules/yahoo/yahoo.service';
import { FundamentalData, RefEntity, RefEntityObject } from './types/commons';
import { Donchian } from './types/market-data';

// async function fetchAllFinvizData(ticker: string): Promise<FinVizObject> {
// 	try {
// 		console.time(ticker);
// 		return Finviz.getStockData(ticker);
// 	} finally {
// 		console.timeEnd(ticker);
// 	}
// }

class TestFirebaseService extends FirebaseService {
  initialize() {
    console.log('TestFirebaseService init');
    admin.initializeApp({
      projectId: 'mr-trading-tg-bot-test',
      credential: admin.credential.applicationDefault(),
      databaseURL: 'https://mr-trading-tg-bot-test-default-rtdb.firebaseio.com/',
    });
  }
}

function getDonchian(asset: AssetEntity, daysBack: number) {
  if (!asset?.history) {
    return null;
  }

  const today = moment().startOf('day').toDate().getTime();

  const donchian = asset.history
    .filter(a => a.date.getDate() < today) //before today only
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, daysBack)
    .reduce(
      (prev, cur) => {
        return {
          ...prev,
          minValue: Math.min(prev.minValue, cur.low),
          maxValue: Math.max(prev.maxValue, cur.high),
        };
      },
      {
        minDays: daysBack,
        minValue: Number.MAX_VALUE,
        maxDays: daysBack,
        maxValue: Number.MIN_VALUE,
      } as Donchian,
    );

  return donchian;
}

function normalizeKey(key: string) {
  return key ? key.replace(/[.#$/\[\]]/, '_') : key;
}

function splitLimit(input: string, splitter: string, limit = -1) {
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

// async function test1() {
//   const app = await NestFactory.createApplicationContext(AppModule);
//   const module = app.select(AppModule);

//   const a = module.get(TemplateService);
//   const x = a.apply('test/template', { data: 'HELLO!' });
//   console.log(x);
//   // const y = await a.prepareNotifications();
//   // console.log(y);
// }

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
  const x = await Axios.get(
    `https://www.alphavantage.co/query?function=${symbol}&symbol=LSI&interval=daily&time_period=14&series_type=close&apikey=DNY0RDWTLM8204BC`,
  );
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
  console.dir(x.errors, { maxArrayLength: null });
  console.timeEnd('test5');
}

async function test6() {
  const yahoo = new YahooService();
  const data = await yahoo.getPrices('AAVL');
  console.dir(data, { maxArrayLength: null });
}

async function test7() {
  const obj = {
    a: {
      b: 5,
      d: 100,
    },
  } as any;

  const src = {
    a: {
      b: 6,
      c: 'hello',
    },
  };

  flatMerge(obj, src, (path, left, right) => {
    if (typeof right === 'number') {
      return left === undefined ? right : left + right;
    }

    return right ?? left;
  });
}

async function test8() {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = 'mr-trading-tg-bot-test-ef3144fab5fb.json';

  admin.initializeApp({
    projectId: 'mr-trading-tg-bot-test',
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://mr-trading-tg-bot-test-default-rtdb.firebaseio.com/',
  });

  const db = admin.database();
  const yahoo = new YahooService();
  let data: RefEntity<AssetEntity> = await db
    .ref('tickers')
    .once('value')
    .then(s => s.val());

  data = plainToClass(RefEntityObject, data, {
    targetMaps: [
      {
        target: RefEntityObject,
        properties: Object.keys(data).reduce((prev, cur) => {
          return {
            ...prev,
            [cur]: AssetEntity,
          };
        }, {}),
      },
    ],
  }) as RefEntity<AssetEntity>;

  for (const asset of Object.values(data)) {
    const price = await yahoo.getPrices(asset.symbol);
    const donchian = getDonchian(asset, 5);

    if (
      price.regularMarketPrice > donchian.maxValue ||
      price.regularMarketPrice < donchian.minValue
    ) {
      console.log(asset.symbol);
    }
  }
  console.log('finish');
}

async function test9() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(FirebaseService)
    .useClass(TestFirebaseService)
    .compile();
  await moduleRef.init();

  const service = moduleRef.get(AssetService);

  const data = await service.findAll();

  console.log(data);
}

async function test() {
  await test8();
  // console.log(normalizeKey('GAZP.ME'));
  // console.log(splitLimit('level1/level2/level3', '/'));
  // console.log(path.relative('level1', 'level1/level2/level3').replace(/\\/, '/'));
}

void test();
