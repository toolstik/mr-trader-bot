import {Context as TelegrafContext} from 'telegraf';
import {I18nContext} from '@edjopato/telegraf-i18n';

export interface Session {
	chatId: number;
	tickers: string[];
	enabled: boolean;
}

export interface MyContext extends TelegrafContext {
	i18n: I18nContext;
	session: Session;
}
