import { Logger, Module } from "@nestjs/common";
import { TelegrafModule } from "nestjs-telegraf";
import { commandPartsMiddleWare } from "./middlewares/command-args.middleware";
import { requestContextMiddleware } from "./middlewares/request-context/request-context.middleware";
import { SessionMiddleware } from "./middlewares/session.middleware";
import { BotModule } from "./modules/bot.module";
import { GlobalModule } from "./modules/global/global.module";
import { AddTickerListCommand } from './plugins/commands/add-ticker-list.command';
import { AddTickerCommand } from './plugins/commands/add-ticker.command';
import { FundamentalsCommand } from "./plugins/commands/fundamentals.command";
import { ListTickerCommand } from './plugins/commands/list-ticker.command';
import { NotifyCommand } from './plugins/commands/notify.command';
import { RemoveTickerListCommand } from './plugins/commands/remove-ticker-list.command';
import { RemoveTickerCommand } from './plugins/commands/remove-ticker.command';
import { TestTickerCommand } from './plugins/commands/test-ticker.command';
import { UpdateHistoryCommand } from './plugins/commands/update-history.command';
import { I18nPlugin } from './plugins/i18n.plugin';
import { MenuPlugin } from './plugins/menu.plugin';
import { AnalysisService } from './services/analysis.service';
import { AssetListService } from './services/asset-list.service';
import { AssetService } from './services/asset.service';
import { BotService } from "./services/bot.service";
import { ConfigService } from './services/config.service';
import { DatahubService } from './services/datahub.service';
import { FinvizService } from './services/finviz.service';
import { FirebaseService } from './services/firebase.service';
import { NotificationService } from './services/notification.service';
import { SessionService } from './services/session.service';
import { TemplateService } from './services/template.service';
import { YahooService } from './services/yahoo.service';


@Module({
	imports: [
		GlobalModule,
		BotModule,
		TelegrafModule.forRootAsync({
			inject: [ConfigService, SessionMiddleware],
			imports: [BotModule],
			useFactory: (configService: ConfigService, sessionMiddleWare: SessionMiddleware) => {
				return {
					token: configService.getEnv().bot_token,
					launchOptions: false,
					middlewares: [
						requestContextMiddleware,
						commandPartsMiddleWare,
						sessionMiddleWare,
					],
					include: [BotModule],
				};
			},
		}),
	],
	providers: [
		FirebaseService,
		AssetService,
		SessionService,
		YahooService,
		FinvizService,
		AssetService,
		BotService,
		AnalysisService,
		TemplateService,
		NotificationService,
		DatahubService,
		AssetListService,

		SessionMiddleware,
		I18nPlugin,
		MenuPlugin,

		AddTickerCommand,
		RemoveTickerCommand,
		ListTickerCommand,
		TestTickerCommand,
		UpdateHistoryCommand,
		NotifyCommand,
		FundamentalsCommand,
		AddTickerListCommand,
		RemoveTickerListCommand,

		{
			provide: Logger,
			useClass: Logger,
		},
	],
})
export class AppModule {

}
