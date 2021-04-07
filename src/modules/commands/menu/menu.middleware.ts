import { Injectable } from '@nestjs/common';
import { MiddlewareObj } from 'telegraf/typings/middleware';
import {
  MenuMiddleware as InlineMenuMiddleware,
  MenuTemplate,
} from 'telegraf-inline-menu/dist/source';

import { StatusChangedArray, StatusChangedKey } from '../../../types/commons';
import { MyContext } from '../../../types/my-context';
import _ = require('lodash');
import { clone } from '../utils';

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

    menuTemplate.select('notification-statuses', StatusChangedArray, {
      // showFalseEmoji: true,
      columns: 1,
      buttonText: (c, key: StatusChangedKey) => c.i18n.t(`menu.settings.notification.${key}`),
      isSet: (c, key: StatusChangedKey) => {
        // console.log('isSet context.session', c.session);
        return c.session.settings.notificationStatuses.includes(key);
      },
      set: (c, key: StatusChangedKey, newState) => {
        // console.log('set context.session', c.session);
        if (!newState) {
          const save = clone(c.session.settings.notificationStatuses);
          c.session.settings.notificationStatuses = _(c.session.settings.notificationStatuses)
            .filter(s => s !== key)
            .uniq()
            .value();
          console.log('-', key, save, '->', c.session.settings.notificationStatuses);
        } else {
          const save = clone(c.session.settings.notificationStatuses);
          c.session.settings.notificationStatuses = _(c.session.settings.notificationStatuses)
            .push(key)
            .uniq()
            .value();
          console.log('+', key, save, '->', c.session.settings.notificationStatuses);
        }
        return true;
      },
    });

    return menuTemplate;
  }
}
