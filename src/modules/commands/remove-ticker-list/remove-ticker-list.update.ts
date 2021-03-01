import { Command, Update } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { RemoveTickerListScene } from './remove-ticker-list.scene';

@Update()
export class RemoveTickerListUpdate {
  @Command('removelist')
  async command() {
    const ctx = currentContext();
    await ctx.scene.enter(RemoveTickerListScene.sceneName);
  }
}
