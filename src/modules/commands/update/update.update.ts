import { Command, Update } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { UpdateScene } from './update.scene';

@Update()
export class UpdateUpdate {
  @Command('update')
  async command() {
    const ctx = currentContext();
    await ctx.scene.enter(UpdateScene.sceneName);
  }
}
