import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TelegrafModule } from 'nestjs-telegraf';

import { commandPartsMiddleWare } from './middlewares/command-args.middleware';
import { FirebaseSessionMiddleware } from './middlewares/firebase-session.middleware';
import { i18nMiddleware } from './middlewares/i18n.middleware';
import { requestContextMiddleware } from './middlewares/request-context/request-context.middleware';
import { ResponseTimeMiddleware } from './middlewares/request-time.middleware';
import { BotModule } from './modules/bot.module';
import { Configuration } from './modules/global/configuration';
import { GlobalModule } from './modules/global/global.module';
import { MenuPlugin } from './plugins/menu.plugin';

@Module({
  imports: [
    GlobalModule,
    EventEmitterModule.forRoot(),
    BotModule,
    TelegrafModule.forRootAsync({
      inject: [Configuration, FirebaseSessionMiddleware, ResponseTimeMiddleware],
      imports: [BotModule],
      useFactory: (
        configService: Configuration,
        sessionMiddleWare: FirebaseSessionMiddleware,
        responceTimeMiddleware: ResponseTimeMiddleware,
      ) => {
        return {
          token: configService.env.bot_token,
          launchOptions: false,
          options: {
            handlerTimeout: 10 * 60 * 1000, // 10 min
          },
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
  exports: [],
})
export class AppModule {}
