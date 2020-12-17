import { NotificationService } from './../../services/notification.service';
import { BotService } from './../../services/bot.service';
import { AssetService } from '../../services/asset.service';
import { AnalysisService } from '../../services/analysis.service';
import { Injectable } from "@nestjs/common";
import Telegraf from 'telegraf';
import { BotPlugin } from "../../types/bot-plugin";
import { MyContext } from "../../types/my-context";
import * as _ from 'lodash';

@Injectable()
export class NotifyCommand implements BotPlugin {

	constructor(
		private notificationService: NotificationService,
	) { }

	register(bot: Telegraf<MyContext>) {
		bot.command('notify', async ctx => {
			const data = await this.notificationService.sentAssetStatusAll();
			await ctx.reply(`Собраны данные по ${Object.keys(data.statuses).length} активам.
			Отправлено ${data.notifications.length} уведомлений`);
		})
	}

}
