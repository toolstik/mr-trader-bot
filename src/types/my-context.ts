import { I18nContext } from '@edjopato/telegraf-i18n';
import { Context as TelegrafContext, Scenes } from 'telegraf';

import { CommandParts } from '../middlewares/command-args.middleware';
import { AssetStateKey } from './commons';

export interface TgSession extends Scenes.SceneSession {
  username: string;
  userFirstName: string;
  userLastName: string;
  groupname: string;
  chatId: number;
  userId: number;
  subscriptionTickers: string[];
  enabled: boolean;
  settings: {
    notificationStatuses: AssetStateKey[];
  };
}

export interface MyContext extends TelegrafContext, Scenes.SceneContext {
  i18n: I18nContext;
  session: TgSession;
  scene: Scenes.SceneContextScene<MyContext, Scenes.SceneSessionData>;
  state: {
    command: CommandParts;
  };
}
