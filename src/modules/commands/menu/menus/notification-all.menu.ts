import _ = require('lodash');
import { MenuTemplate } from 'telegraf-inline-menu/dist/source';

import { MyContext } from '../../../../types/my-context';

const menuTemplate = new MenuTemplate<MyContext>(
  c => `Выберите статусы, по которым хотите получать уведомления`,
);

menuTemplate.select('menu-notification-statuses-all', ['ALL'], {
  // showFalseEmoji: true,
  columns: 1,
  showFalseEmoji: true,
  buttonText: (c, key) => c.i18n.t(`menu.settings.notification.${key}.TRUE`),
  isSet: (c, key) => {
    return true;
  },
  set: (c, key, newState) => {
    // console.log('set context.session', c.session);
    if (!newState) {
      c.session.settings.subscribeAll = false;
      return '..';
    }
    return false;
  },
});

export const notificationSettingsAllMenu = menuTemplate;
