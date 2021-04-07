import _ = require('lodash');
import { Injectable } from '@nestjs/common';
import { Composer } from 'telegraf';
import { MiddlewareObj } from 'telegraf/typings/middleware';
import * as TelegrafSessionFirebase from 'telegraf-session-firebase';
import { PartialDeep } from 'type-fest';

import { defaultsDeep } from '../modules/commands/utils';
import { FirebaseService } from '../modules/firebase/firebase.service';
import { MyContext, TgSession } from '../types/my-context';

@Injectable()
export class FirebaseSessionMiddleware implements MiddlewareObj<MyContext> {
  constructor(private firebase: FirebaseService) {}

  middleware() {
    const database = this.firebase.getDatabase();
    const databaseSession = TelegrafSessionFirebase(database.ref('sessions'));

    return Composer.compose<MyContext>([
      databaseSession,
      (ctx: MyContext, next) => {
        const defaults: PartialDeep<TgSession> = {
          enabled: true,
          subscriptionTickers: [],
          settings: {
            subscribeAll: true,
          },
        };

        const state: PartialDeep<TgSession> = {
          username: ctx.from?.username ?? '',
          userFirstName: ctx.from.first_name ?? '',
          userLastName: ctx.from.last_name ?? '',
          groupname: ctx.chat.type === 'group' ? ctx.chat.title : null,
          chatId: ctx.chat.id,
          userId: ctx.from?.id,
        };

        ctx.session = _(ctx.session || {})
          .merge(state)
          .mergeWith(defaults, defaultsDeep)
          .value() as TgSession;

        // console.log(ctx.session);
        // console.log('session-middleware session', ctx.session);

        return next();
      },
    ]);
  }
}
