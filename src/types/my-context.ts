import { I18nContext } from '@edjopato/telegraf-i18n';
import { Context as TelegrafContext } from 'telegraf';
import { SceneContextMessageUpdate } from 'telegraf/typings/stage';

export interface TgSession {
	username: string;
	chatId: number;
	subscriptionTickers: string[];
	enabled: boolean;
}

export interface MyContext extends TelegrafContext, SceneContextMessageUpdate {
	i18n: I18nContext;
	session: TgSession;
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
