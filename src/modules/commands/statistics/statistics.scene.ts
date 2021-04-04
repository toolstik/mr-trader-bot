import { Scene, SceneEnter } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { parseTickerList } from '../utils';
import { StatisticsService } from './statistics.service';

@Scene(StatisticsScene.sceneName)
export class StatisticsScene {
  static sceneName = 'statistics';

  constructor(private service: StatisticsService) {}

  @SceneEnter()
  async enter() {
    const ctx = currentContext();
    await this.process();
    await ctx.scene.leave();
  }

  private async process() {
    const ctx = currentContext();
    const tickers = parseTickerList(ctx.state.command.args);

    await this.service.calcTickerStats(tickers);
  }
}
