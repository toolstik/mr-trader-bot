import { Scene, SceneEnter } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { MenuMiddleware } from './menu.middleware';

@Scene(MenuScene.sceneName)
export class MenuScene {
  static sceneName = 'menu';

  constructor(private menuMiddleWare: MenuMiddleware) {}

  @SceneEnter()
  async enter() {
    const ctx = currentContext();
    await this.process();
    await ctx.scene.leave();
  }

  private async process() {
    const ctx = currentContext();
    await this.menuMiddleWare.reply(ctx);
  }
}
