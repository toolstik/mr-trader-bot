import { Command, Update } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { StatisticsScene } from './statistics.scene';

@Update()
export class StatisticsUpdate {
  @Command(['stat', 'stats', 'statistics'])
  async command() {
    const ctx = currentContext();
    await ctx.scene.enter(StatisticsScene.sceneName);
  }
}
