import PromisePool = require('@supercharge/promise-pool/dist');
import { Scene, SceneEnter } from 'nestjs-telegraf';

import { FundamentalData } from '../../../types/commons';
import { currentContext } from '../../../utils/current-context';
import { AssetService } from '../../asset/asset.service';
import { NotificationService } from '../../notification/notification.service';

@Scene(FundamentalsScene.sceneName)
export class FundamentalsScene {
  static sceneName = 'fundamentals';

  constructor(
    private notificationService: NotificationService,
    private assetService: AssetService,
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

    const inputTickers = args.filter(t => !!t?.trim()).map(t => t.toUpperCase());

    if (inputTickers.length === 1 && inputTickers[0] === 'ALL') {
      await this.notificationService.sendAssetFundamentalsAll();
      return;
    }

    const subscriptionTickers = ctx.session.subscriptionTickers ?? [];

    const tickers = inputTickers.length ? inputTickers : subscriptionTickers;

    const poolResult = await PromisePool.for(tickers)
      .withConcurrency(10)
      .process(async t => {
        const data = await this.assetService.getFundamentals(t).catch(e => null as FundamentalData);

        if (!data) {
          // await ctx.reply(ctx.i18n.t('commands.add-ticker.not-found', { ticker: t }));
          return {
            ticker: t,
            data,
            apply: false,
          };
        }

        return {
          ticker: t,
          data,
          apply: true,
        };
      });

    const goodResults = poolResult.results.filter(r => r.apply);

    for (const r of goodResults) {
      await this.notificationService.sendAssetFundamentals(ctx, r.data);
    }
  }
}
