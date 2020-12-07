import {Context as TelegrafContext} from 'telegraf';
import {I18nContext} from '@edjopato/telegraf-i18n';

export interface Session {
	username: string;
	chatId: number;
	subscriptionTickers: string[];
	enabled: boolean;
}

export interface MyContext extends TelegrafContext {
	i18n: I18nContext;
	session: Session;
	state: {
		command: {
			text: string;
			command: string;
			bot: string;
			args: string;
			splitArgs: readonly string[];
		}
	}
}
