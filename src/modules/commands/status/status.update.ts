import { Command, Update } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { StatusScene } from './status.scene';

@Update()
export class StatusUpdate {
  @Command('status')
  async command() {
    const ctx = currentContext();
    await ctx.scene.enter(StatusScene.sceneName);
  }
}
