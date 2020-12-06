import { SessionService } from './services/session.service';
import { AssetService } from './services/asset.service';
import { I18nPlugin } from './plugins/i18n.plugin';
import { SessionPlugin } from './plugins/session.plugin';
import { Module } from "@nestjs/common";
import { BotService } from "./services/bot.service";
import { YahooService } from './services/yahoo.service';
import { FirebaseService } from './services/firebase.service';
import { ReferenceService } from './services/reference.service';
import { CommandArgsPlugin } from './plugins/command-args.plugin';
import { AddTickerCommand } from './plugins/commands/add-ticker.command';


@Module({
	providers: [
		FirebaseService,
		AssetService,
		SessionService,
		YahooService,
		AssetService,
		BotService,

		SessionPlugin,
		I18nPlugin,
		CommandArgsPlugin,

		AddTickerCommand,
	],
})
export class AppModule {

}
