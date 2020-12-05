import { FirebaseService } from './services/firebase.service';
import { NestFactory } from "@nestjs/core/nest-factory";
import { AppModule } from "./app.module";


async function test() {
	const app = await NestFactory.createApplicationContext(AppModule);
	const service = app.select(AppModule).get(FirebaseService, { strict: true });
	console.log(service.getDatabase().ref())
}

void test();


