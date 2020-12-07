import { AnalysisService } from './services/analysis.service';
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function test() {

	const app = await NestFactory.createApplicationContext(AppModule);
	const module = app.select(AppModule);

	const a = module.get(AnalysisService);
	const status = a.getAssetStatus('AAPL');
	console.log(status);
}

void test();


