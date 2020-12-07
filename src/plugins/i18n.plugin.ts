import { I18n as TelegrafI18n } from '@edjopato/telegraf-i18n';
import { Injectable } from "@nestjs/common";
import Telegraf from 'telegraf';
import { BotPlugin } from '../types/bot-plugin';
import { MyContext } from '../types/my-context';


@Injectable()
export class I18nPlugin implements BotPlugin {

	register(bot: Telegraf<MyContext>) {
		const i18n = new TelegrafI18n({
			directory: 'locales',
			defaultLanguage: 'ru',
			defaultLanguageOnMissing: true,
			useSession: true,
		});
		bot.use(i18n.middleware());
	}



}
