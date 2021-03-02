import { Scene, SceneEnter } from 'nestjs-telegraf';

import { paginate } from '../../../types/commons';
import { currentContext } from '../../../utils/current-context';

@Scene(ListTickerScene.sceneName)
export class ListTickerScene {
  static sceneName = 'list-ticker';

  @SceneEnter()
  async enter() {
    const ctx = currentContext();
    await this.process();
    await ctx.scene.leave();
  }

  private async process() {
    const ctx = currentContext();

    const tickers = ctx.session.subscriptionTickers ?? [];

    const pages = paginate(tickers, 300);

    await ctx.reply(ctx.i18n.t('commands.list-ticker.success'));

    for (const p of pages) {
      await ctx.reply(p.items.join(', '));
    }
  }
}
