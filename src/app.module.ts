import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TelegrafModule } from 'nestjs-telegraf';

import { AnyExceptionFilter } from './any-exception.filter';
import { commandPartsMiddleWare } from './middlewares/command-args.middleware';
import { FirebaseSessionMiddleware } from './middlewares/firebase-session.middleware';
import { i18nMiddleware } from './middlewares/i18n.middleware';
import { requestContextMiddleware } from './middlewares/request-context/request-context.middleware';
import { ResponseTimeMiddleware } from './middlewares/request-time.middleware';
import { BotModule } from './modules/bot.module';
import { MenuMiddleware } from './modules/commands/menu/menu.middleware';
import { MenuModule } from './modules/commands/menu/menu.module';
import { Configuration } from './modules/global/configuration';
import { GlobalModule } from './modules/global/global.module';
import { MenuPlugin } from './plugins/menu.plugin';

@Module({
  imports: [
    GlobalModule,
    EventEmitterModule.forRoot(),
    BotModule,
    TelegrafModule.forRootAsync({
      inject: [Configuration, FirebaseSessionMiddleware, ResponseTimeMiddleware, MenuMiddleware],
      imports: [BotModule, MenuModule],
      useFactory: (
        configService: Configuration,
        sessionMiddleWare: FirebaseSessionMiddleware,
        responceTimeMiddleware: ResponseTimeMiddleware,
        menuMiddleWare: MenuMiddleware,
      ) => {
        return {
          token: configService.env.bot_token,
          launchOptions: false,
          options: {
            handlerTimeout: 8.5 * 60 * 1000, // 8.5 min
          },
          middlewares: [
            responceTimeMiddleware.middleware(),
            requestContextMiddleware,
            commandPartsMiddleWare,
            i18nMiddleware,
            sessionMiddleWare.middleware(),
            menuMiddleWare.middleware(),
          ],
          include: [BotModule],
        };
      },
    }),
  ],
  providers: [
    MenuPlugin,
    {
      provide: APP_FILTER,
      useClass: AnyExceptionFilter,
    },
  ],
  exports: [],
})
export class AppModule {}
