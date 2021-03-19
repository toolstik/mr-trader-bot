import { Scene, SceneEnter } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { EventService } from '../../event/event.service';

@Scene(StatisticsScene.sceneName)
export class StatisticsScene {
  static sceneName = 'statistics';

  constructor(private eventService: EventService) {}

  @SceneEnter()
  async enter() {
    const ctx = currentContext();
    await this.process();
    await ctx.scene.leave();
  }

  private async process() {
    // const ctx = currentContext();
    // const session = ctx.session;
    await this.eventService.test();
  }
}
