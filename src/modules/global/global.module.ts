import { Global, Logger, Module } from "@nestjs/common";
import { ResponseTimeMiddleware } from "../../middlewares/request-time.middleware";
import { ConfigService } from "./config.service";

@Global()
@Module({
	providers: [
		ConfigService,
		ResponseTimeMiddleware,
		{
			provide: Logger,
			useClass: Logger,
		},
	],
	exports: [
		ConfigService,
		ResponseTimeMiddleware,
		Logger,
	],
})
export class GlobalModule {

}
