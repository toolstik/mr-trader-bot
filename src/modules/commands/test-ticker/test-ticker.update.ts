import { Command, Update } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { TestTickerScene } from './test-ticker.scene';

@Update()
export class TestTickerUpdate {
  @Command('test')
  async command() {
    const ctx = currentContext();
    await ctx.scene.enter(TestTickerScene.sceneName);
  }
}
