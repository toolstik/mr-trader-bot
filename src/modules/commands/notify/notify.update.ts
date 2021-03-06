import { Command, Update } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { NotifyScene } from './notify.scene';

@Update()
export class NotifyUpdate {
  @Command('notify')
  async command() {
    const ctx = currentContext();
    await ctx.scene.enter(NotifyScene.sceneName);
  }
}
