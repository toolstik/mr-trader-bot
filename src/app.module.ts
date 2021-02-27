import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';

import { commandPartsMiddleWare } from './middlewares/command-args.middleware';
import { i18nMiddleware } from './middlewares/i18n.middleware';
import { requestContextMiddleware } from './middlewares/request-context/request-context.middleware';
import { ResponseTimeMiddleware } from './middlewares/request-time.middleware';
import { SessionMiddleware } from './middlewares/session.middleware';
import { AssetService } from './modules/asset/asset.service';
import { AssetListService } from './modules/asset-list/asset-list.service';
import { BotModule } from './modules/bot.module';
import { DatahubService } from './modules/datahub/datahub.service';
import { FinvizService } from './modules/finviz/finviz.service';
import { FirebaseService } from './modules/firebase/firebase.service';
import { ConfigService } from './modules/global/config.service';
import { GlobalModule } from './modules/global/global.module';
import { SessionService } from './modules/session/session.service';
import { YahooService } from './modules/yahoo/yahoo.service';
import { AddTickerCommand } from './plugins/commands/add-ticker.command';
import { AddTickerListCommand } from './plugins/commands/add-ticker-list.command';
import { FundamentalsCommand } from './plugins/commands/fundamentals.command';
import { ListTickerCommand } from './plugins/commands/list-ticker.command';
import { NotifyCommand } from './plugins/commands/notify.command';
import { RemoveTickerCommand } from './plugins/commands/remove-ticker.command';
import { RemoveTickerListCommand } from './plugins/commands/remove-ticker-list.command';
import { TestTickerCommand } from './plugins/commands/test-ticker.command';
import { UpdateHistoryCommand } from './plugins/commands/update-history.command';
import { MenuPlugin } from './plugins/menu.plugin';
import { AnalysisService } from './services/analysis.service';
import { BotService } from './services/bot.service';
import { NotificationService } from './services/notification.service';
import { TemplateService } from './services/template.service';

@Module({
  imports: [
    GlobalModule,
    BotModule,
    TelegrafModule.forRootAsync({
      inject: [ConfigService, SessionMiddleware, ResponseTimeMiddleware],
      imports: [BotModule],
      useFactory: (
        configService: ConfigService,
        sessionMiddleWare: SessionMiddleware,
        responceTimeMiddleware: ResponseTimeMiddleware,
      ) => {
        return {
          token: configService.getEnv().bot_token,
          launchOptions: false,
          middlewares: [
            requestContextMiddleware,
            commandPartsMiddleWare,
            i18nMiddleware,
            sessionMiddleWare,
            responceTimeMiddleware,
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
  ],
})
export class AppModule {}
