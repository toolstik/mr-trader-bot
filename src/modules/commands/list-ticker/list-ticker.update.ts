import { Command, Update } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { ListTickerScene } from './list-ticker.scene';

@Update()
export class ListTickerUpdate {
  @Command('list')
  async addCommand() {
    const ctx = currentContext();
    await ctx.scene.enter(ListTickerScene.sceneName);
  }
}
