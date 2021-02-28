import { Command, Update } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { RemoveTickerScene } from './remove-ticker.scene';

@Update()
export class RemoveTickerUpdate {
  @Command(['remove', 'delete'])
  async addCommand() {
    const ctx = currentContext();
    await ctx.scene.enter(RemoveTickerScene.sceneName);
  }
}
