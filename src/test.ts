import { TemplateService } from './services/template.service';
import { BotService } from './services/bot.service';
import { AnalysisService } from './services/analysis.service';
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as path from 'path';

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
	const x = a.apply('test/template', 'ru', {data: 'HELLO!'});
	console.log(x);
	// const y = await a.prepareNotifications();
	// console.log(y);
}

async function test() {

	await test1()
	// console.log(normalizeKey('GAZP.ME'));
	// console.log(splitLimit('level1/level2/level3', '/'));
	// console.log(path.relative('level1', 'level1/level2/level3').replace(/\\/, '/'));
}



void test();


