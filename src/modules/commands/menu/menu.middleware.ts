import { Injectable } from '@nestjs/common';
import { MiddlewareObj } from 'telegraf/typings/middleware';
import {
  MenuMiddleware as InlineMenuMiddleware,
  MenuTemplate,
} from 'telegraf-inline-menu/dist/source';

import { AssetStateArray, AssetStateKey } from '../../../types/commons';
import { MyContext } from '../../../types/my-context';
import _ = require('lodash');

@Injectable()
export class MenuMiddleware implements MiddlewareObj<MyContext> {
  private wrapper: InlineMenuMiddleware<MyContext>;

  constructor() {
    const menu = this.getMenu();
    this.wrapper = new InlineMenuMiddleware('/', menu);
  }

  middleware() {
    return this.wrapper.middleware();
  }

  reply(context: MyContext) {
    return this.wrapper.replyToContext(context);
  }

  private getMenu() {
    const menuTemplate = new MenuTemplate<MyContext>(
      c => `Выберите статусы, по которым хотите получать уведомления`,
    );

    menuTemplate.select('notification-statuses', AssetStateArray, {
      // showFalseEmoji: true,
      columns: 1,
      isSet: (c, key: AssetStateKey) => {
        // console.log('isSet context.session', c.session);
        return c.session.settings.notificationStatuses.includes(key);
      },
      set: (c, key: AssetStateKey, newState) => {
        // console.log('set context.session', c.session);
        if (!newState) {
          c.session.settings.notificationStatuses = _(c.session.settings.notificationStatuses)
            .filter(s => s !== key)
            .uniq()
            .value();

          return true;
        }
        c.session.settings.notificationStatuses.push(key);
        return true;
      },
    });

    return menuTemplate;
  }
}
