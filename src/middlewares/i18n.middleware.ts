import { I18n as TelegrafI18n } from '@edjopato/telegraf-i18n';

const i18n = new TelegrafI18n({
  directory: 'assets/locales',
  defaultLanguage: 'ru',
  defaultLanguageOnMissing: true,
  useSession: true,
});

export const i18nMiddleware = i18n.middleware();
