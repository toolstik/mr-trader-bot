import { Logger, Module } from "@nestjs/common";
import { CommandArgsPlugin } from './plugins/command-args.plugin';
import { AddTickerCommand } from './plugins/commands/add-ticker.command';
import { ListTickerCommand } from './plugins/commands/list-ticker.command';
import { NotifyCommand } from './plugins/commands/notify.command';
import { RemoveTickerCommand } from './plugins/commands/remove-ticker.command';
import { TestTickerCommand } from './plugins/commands/test-ticker.command';
import { UpdateHistoryCommand } from './plugins/commands/update-history.command';
import { I18nPlugin } from './plugins/i18n.plugin';
import { SessionPlugin } from './plugins/session.plugin';
import { AnalysisService } from './services/analysis.service';
import { AssetService } from './services/asset.service';
import { BotService } from "./services/bot.service";
import { FirebaseService } from './services/firebase.service';
import { NotificationService } from './services/notification.service';
import { SessionService } from './services/session.service';
import { TemplateService } from './services/template.service';
import { YahooService } from './services/yahoo.service';
import { FundamentalsCommand } from "./plugins/commands/fundamentals.command";


@Module({
	providers: [
		FirebaseService,
		AssetService,
		SessionService,
		YahooService,
		AssetService,
		BotService,
		AnalysisService,
		TemplateService,
		NotificationService,

		SessionPlugin,
		I18nPlugin,
		CommandArgsPlugin,

		AddTickerCommand,
		RemoveTickerCommand,
		ListTickerCommand,
		TestTickerCommand,
		UpdateHistoryCommand,
		NotifyCommand,
		FundamentalsCommand,

		{
			provide: Logger,
			useClass: Logger,
		},
	],
})
export class AppModule {

}
