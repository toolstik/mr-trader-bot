import { I18n } from '@edjopato/telegraf-i18n';
import { MenuTemplate } from 'telegraf-inline-menu';

import { MyContext } from '../../../types/my-context';
import { backButtons } from '../general';

const availableLocales = new I18n({ directory: 'locales' }).availableLocales();

export const menu = new MenuTemplate<MyContext>(context => context.i18n.t('settings.language'));

menu.select('lang', availableLocales, {
  isSet: (context, key) => context.i18n.locale() === key,
  set: (context, key) => {
    context.i18n.locale(key);
    return true;
  },
});

menu.manualRow(backButtons);
