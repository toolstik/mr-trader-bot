import { Scene, SceneEnter } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { NotificationService } from '../../notification/notification.service';

@Scene(StatusScene.sceneName)
export class StatusScene {
  static sceneName = 'status';

  constructor(private notificationService: NotificationService) {}

  @SceneEnter()
  async enter() {
    const ctx = currentContext();
    await this.process();
    await ctx.scene.leave();
  }

  private async process() {
    await this.notificationService.sendAssetStatusStateAllPages();
  }
}
