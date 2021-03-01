import { Scene, SceneEnter } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { NotificationService } from '../../notification/notification.service';

@Scene(TestTickerScene.sceneName)
export class TestTickerScene {
  static sceneName = 'notify';

  constructor(private notificationService: NotificationService) {}

  @SceneEnter()
  async enter() {
    const ctx = currentContext();
    await this.process();
    await ctx.scene.leave();
  }

  private async process() {
    const ctx = currentContext();
    const data = await this.notificationService.sendAssetStatusChangesAll();
    await ctx.reply(`Собраны данные по ${Object.keys(data.statuses).length} активам.
			Отправлено ${data.notifications.length} уведомлений`);
  }
}
