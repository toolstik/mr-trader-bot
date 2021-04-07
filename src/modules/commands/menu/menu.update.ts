import { Command, Update } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { MenuScene } from './menu.scene';

@Update()
export class MenuUpdate {
  @Command('menu')
  async command() {
    const ctx = currentContext();
    await ctx.scene.enter(MenuScene.sceneName);
  }
}
