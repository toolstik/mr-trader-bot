import { NotifyCommand } from './plugins/commands/notify.command';
import { UpdateHistoryCommand } from './plugins/commands/update-history.command';
import { AnalysisService } from './services/analysis.service';
import { ListTickerCommand } from './plugins/commands/list-ticker.command';
import { SessionService } from './services/session.service';
import { AssetService } from './services/asset.service';
import { I18nPlugin } from './plugins/i18n.plugin';
import { SessionPlugin } from './plugins/session.plugin';
import { Module, Logger } from "@nestjs/common";
import { BotService } from "./services/bot.service";
import { YahooService } from './services/yahoo.service';
import { FirebaseService } from './services/firebase.service';
import { ReferenceService } from './services/reference.service';
import { CommandArgsPlugin } from './plugins/command-args.plugin';
import { AddTickerCommand } from './plugins/commands/add-ticker.command';
import { TestTickerCommand } from './plugins/commands/test-ticker.command';
import { TemplateService } from './services/template.service';


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

		SessionPlugin,
		I18nPlugin,
		CommandArgsPlugin,

		AddTickerCommand,
		ListTickerCommand,
		TestTickerCommand,
		UpdateHistoryCommand,
		NotifyCommand,

		{
            provide: Logger,
            useClass: Logger,
        },
	],
})
export class AppModule {

}
