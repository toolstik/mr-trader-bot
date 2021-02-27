import { Command, Update } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { AddTickerListScene } from './add-ticker-list.scene';

@Update()
export class AddTickerListUpdate {
  @Command('addlist')
  async addCommand() {
    const ctx = currentContext();
    await ctx.scene.enter(AddTickerListScene.sceneName);
  }
}
