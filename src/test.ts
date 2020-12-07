import { BotService } from './services/bot.service';
import { AnalysisService } from './services/analysis.service';
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

function normalizeKey(key: string) {
	return key ? key.replace(/[.#$/\[\]]/, '_') : key;
}

async function test1() {
	const app = await NestFactory.createApplicationContext(AppModule);
	const module = app.select(AppModule);

	const a = module.get(BotService);
	// const y = await a.prepareNotifications();
	// console.log(y);
}

async function test() {

	await test1()
	// console.log(normalizeKey('GAZP.ME'));
}



void test();


