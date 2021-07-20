import { Scene, SceneEnter } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { AnalysisService } from '../../analysis/analysis.service';
import { NotificationService } from '../../notification/notification.service';

@Scene(TestTickerScene.sceneName)
export class TestTickerScene {
  static sceneName = 'test-ticker';

  constructor(
    private analysisService: AnalysisService,
    private notificationService: NotificationService,
  ) {}

  @SceneEnter()
  async enter() {
    const ctx = currentContext();
    await this.process();
    await ctx.scene.leave();
  }

  private async process() {
    const ctx = currentContext();

    const args = ctx.state.command.splitArgs;

    const tickers = args.filter(t => !!t).map(t => t.toUpperCase());

    if (!tickers?.length) {
      await ctx.reply(ctx.i18n.t('commands.test-ticker.no-ticker-specified'));
      return;
    }

    for (const ticker of tickers) {
      const status = await this.analysisService.getAssetStatus(ticker, { fundamentals: true });

      if (!status) {
        await ctx.reply(ctx.i18n.t('commands.test-ticker.ticker-not-found', { ticker }));
        return;
      }

      await this.notificationService.sendAssetStatus(ctx, status);
    }
  }
}
