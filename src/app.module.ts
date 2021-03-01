import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';

import { commandPartsMiddleWare } from './middlewares/command-args.middleware';
import { FirebaseSessionMiddleware } from './middlewares/firebase-session.middleware';
import { i18nMiddleware } from './middlewares/i18n.middleware';
import { requestContextMiddleware } from './middlewares/request-context/request-context.middleware';
import { ResponseTimeMiddleware } from './middlewares/request-time.middleware';
import { BotModule } from './modules/bot.module';
import { ConfigService } from './modules/global/config.service';
import { GlobalModule } from './modules/global/global.module';
import { MenuPlugin } from './plugins/menu.plugin';

@Module({
  imports: [
    GlobalModule,
    BotModule,
    TelegrafModule.forRootAsync({
      inject: [ConfigService, FirebaseSessionMiddleware, ResponseTimeMiddleware],
      imports: [BotModule],
      useFactory: (
        configService: ConfigService,
        sessionMiddleWare: FirebaseSessionMiddleware,
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
  providers: [MenuPlugin],
})
export class AppModule {}
