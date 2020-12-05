import { I18nPlugin } from './plugins/i18n.plugin';
import { SessionPlugin } from './plugins/session.plugin';
import { Module } from "@nestjs/common";
import { BotService } from "./services/bot.service";
import { FinanceService } from './services/finance.service';
import { FirebaseService } from './services/firebase.service';
import { StorageService } from './services/storage.service';


@Module({
	providers: [
		FirebaseService,
		StorageService,
		FinanceService,
		BotService,

		SessionPlugin,
		I18nPlugin,
	],
})
export class AppModule {

}
