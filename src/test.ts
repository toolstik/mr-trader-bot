import { AnalysisService } from './services/analysis.service';
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

function normalizeKey(key: string) {
	return key ? key.replace(/[.#$/\[\]]/, '_') : key;
}

async function test() {

	// const app = await NestFactory.createApplicationContext(AppModule);
	// const module = app.select(AppModule);

	// const a = module.get(AnalysisService);
	// const status = a.getAssetStatus('AAPL');
	console.log(normalizeKey('GAZP.ME'));
}

void test();


