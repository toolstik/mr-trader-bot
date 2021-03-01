import { Command, Update } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { FundamentalsScene } from './fundamentals.scene';

@Update()
export class FundamentalsUpdate {
  @Command('fundamentals')
  async command() {
    const ctx = currentContext();
    await ctx.scene.enter(FundamentalsScene.sceneName);
  }
}
