import { Global, Logger, Module } from "@nestjs/common";
import { ConfigService } from "./config.service";

@Global()
@Module({
	providers: [
		ConfigService,
		{
			provide: Logger,
			useClass: Logger,
		},
	],
	exports: [
		ConfigService,
		Logger,
	],
})
export class GlobalModule {

}
