import { Scene, SceneEnter } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { EventEmitterService } from '../../global/event-emitter.service';
import { NotificationService } from '../../notification/notification.service';

@Scene(NotifyScene.sceneName)
export class NotifyScene {
  static sceneName = 'notify';

  constructor(
    private notificationService: NotificationService,
  ) {}

  @SceneEnter()
  async enter() {
    const ctx = currentContext();
    await this.process();
    await ctx.scene.leave();
  }

  private async process() {
    const ctx = currentContext();
    const data = await this.notificationService.sendAssetStatusChangesAll();
    await ctx.reply(`Собраны данные по ${data.length} активам.
			${data.filter(s => s.events.length > 0).length} активов изменили свои статусы`);
  }
}
