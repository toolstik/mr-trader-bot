import { Command, Update } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { AddTickerScene } from './add-ticker.scene';

@Update()
export class AddTickerUpdate {
  @Command('add')
  async addCommand() {
    const ctx = currentContext();
    await ctx.scene.enter(AddTickerScene.sceneName);
  }
}
