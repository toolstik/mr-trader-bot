import { I18nContext } from '@edjopato/telegraf-i18n';
import { Context as TelegrafContext } from 'telegraf';
import { SceneContext, SceneContextScene, SceneSession, SceneSessionData } from 'telegraf/typings/scenes';

export interface TgSession extends SceneSession {
	username: string;
	chatId: number;
	subscriptionTickers: string[];
	enabled: boolean;
}

export interface MyContext extends TelegrafContext, SceneContext {
	i18n: I18nContext;
	session: TgSession;
	scene: SceneContextScene<MyContext, SceneSessionData>
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
