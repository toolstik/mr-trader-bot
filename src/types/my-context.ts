import { I18nContext } from '@edjopato/telegraf-i18n';
import { Context as TelegrafContext, Scenes } from 'telegraf';
import { CommandParts } from '../plugins/command-args.plugin';

export interface TgSession extends Scenes.SceneSession {
	username: string;
	chatId: number;
	subscriptionTickers: string[];
	enabled: boolean;
}

export interface MyContext extends TelegrafContext, Scenes.SceneContext {
	i18n: I18nContext;
	session: TgSession;
	scene: Scenes.SceneContextScene<MyContext, Scenes.SceneSessionData>
	state: {
		command: CommandParts,
	}
}
