import _ = require('lodash');
import { MenuTemplate } from 'telegraf-inline-menu/dist/source';

import { StatusChangedArray, StatusChangedKey } from '../../../../types/commons';
import { MyContext } from '../../../../types/my-context';

const menuTemplate = new MenuTemplate<MyContext>(c =>
  !c.session.settings?.subscribeAll
    ? `Выберите статусы, по которым хотите получать уведомления`
    : `Сейчас вы подписаны на ВСЕ статусы. Нажмите на кнопку, чтобы выбрать статусы, по которым хотите получать уведомления`,
);

menuTemplate.select('notificationSettingsMenu-select-all', ['ALL'], {
  showFalseEmoji: false,
  buttonText: (c, key) => {
    const translateValue = !!c.session.settings?.subscribeAll ? 'YES' : 'NO';
    return c.i18n.t(`menu.settings.notification.${key}.${translateValue}`);
  },
  isSet: c => !!c.session.settings?.subscribeAll,
  set: async (c, key, state) => {
    c.session.settings.subscribeAll = state;

    if (state && !c.session.settings.subscriptionStatuses?.length) {
      c.session.settings.subscriptionStatuses = [...StatusChangedArray];
    }

    return true;
  },
});

menuTemplate.select(
  'notificationSettingsMenu-select',
  c => (!c.session.settings?.subscribeAll ? StatusChangedArray : []),
  {
    // showFalseEmoji: true,
    columns: 1,
    showFalseEmoji: true,
    buttonText: (c, key: StatusChangedKey) => {
      return c.i18n.t(`menu.settings.notification.${key}`);
    },
    isSet: (c, key: StatusChangedKey) => {
      return !!c.session.settings?.subscriptionStatuses?.includes(key);
    },
    set: (c, key: StatusChangedKey, state) => {
      if (!state) {
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

export const notificationSettingsMenu = menuTemplate;
