import { Scene, SceneEnter } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { AssetService } from '../../asset/asset.service';

@Scene(UpdateHistoryScene.sceneName)
export class UpdateHistoryScene {
  static sceneName = 'update-history';

  constructor(private assetService: AssetService) {}

  @SceneEnter()
  async enter() {
    const ctx = currentContext();
    await this.process();
    await ctx.scene.leave();
  }

  private async process() {
    const ctx = currentContext();
    const status = await this.assetService.updateHistory();

    const keys = Object.keys(status.newValue);
    const errors = status.errors.map(e => e.item).join(', ');

    await ctx.reply(
      `Обновлены данные по ${keys.length} активам.` + (errors ? ` Ошибки: ${errors}` : ''),
    );
  }
}
