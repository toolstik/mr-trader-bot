import { Command, Update } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { UpdateHistoryScene } from './update-history.scene';

@Update()
export class UpdateHistoryUpdate {
  @Command(['updateHistory', 'updatehistory'])
  async command() {
    const ctx = currentContext();
    await ctx.scene.enter(UpdateHistoryScene.sceneName);
  }
}
