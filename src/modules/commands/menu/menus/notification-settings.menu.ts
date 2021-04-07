import _ = require('lodash');
import { MenuTemplate } from 'telegraf-inline-menu/dist/source';

import { StatusChangedArray, StatusChangedKey } from '../../../../types/commons';
import { MyContext } from '../../../../types/my-context';
import { notificationSettingsAllMenu } from './notification-all.menu';

const menuTemplate = new MenuTemplate<MyContext>(
  c => `Выберите статусы, по которым хотите получать уведомления`,
);

type ButtonKey = StatusChangedKey | 'ALL';

menuTemplate.select(
  'menu-notification-statuses',
  c => {
    if (c.session.settings?.subscribeAll) {
      return ['ALL'];
    }
    return ['ALL', ...StatusChangedArray];
  },
  {
    // showFalseEmoji: true,
    columns: 1,
    showFalseEmoji: true,
    buttonText: (c, key: ButtonKey) => {
      if (key === 'ALL') {
        const translateValue = !!c.session.settings?.subscribeAll ? 'YES' : 'NO';
        return c.i18n.t(`menu.settings.notification.${key}.${translateValue}`);
      }
      return c.i18n.t(`menu.settings.notification.${key}`);
    },
    isSet: (c, key: ButtonKey) => {
      if (key === 'ALL') {
        return !!c.session.settings?.subscribeAll;
      }
      return !!c.session.settings?.subscriptionStatuses?.includes(key);
    },
    set: (c, key: ButtonKey, newState) => {
      if (key === 'ALL') {
        c.session.settings.subscribeAll = newState;
        return true;
      }

      if (!newState) {
        c.session.settings.subscriptionStatuses = _(c.session.settings.subscriptionStatuses || [])
          .filter(s => s !== key)
          .uniq()
          .value();
      } else {
        c.session.settings.subscriptionStatuses = _(c.session.settings.subscriptionStatuses || [])
          .push(key)
          .uniq()
          .value();
      }
      return true;
    },
  },
);

menuTemplate.submenu('all', 'menu-notification-statuses-all', notificationSettingsAllMenu, {
  hide: () => true,
});

export const notificationSettingsMenu = menuTemplate;
