import { Command, Update } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { HelpScene } from './help.scene';

@Update()
export class HelpUpdate {
  @Command('help')
  async command() {
    const ctx = currentContext();
    await ctx.scene.enter(HelpScene.sceneName);
  }
}
