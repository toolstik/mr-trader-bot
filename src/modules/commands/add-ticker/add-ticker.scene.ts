import PromisePool = require('@supercharge/promise-pool/dist');
import _ = require('lodash');
import { Scene, SceneEnter } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { AssetService } from '../../asset/asset.service';
import { YahooService } from '../../yahoo/yahoo.service';
import { parseTickerList } from '../utils';

@Scene(AddTickerScene.sceneName)
export class AddTickerScene {
  static sceneName = 'add-ticker';

  constructor(private assetService: AssetService, private yahooService: YahooService) {}

  @SceneEnter()
  async enter() {
    const ctx = currentContext();
    await this.process();
    await ctx.scene.leave();
  }

  private async process() {
    const ctx = currentContext();

    const addTickers = parseTickerList(ctx.state.command.args);

    if (!addTickers?.length) {
      await ctx.reply(ctx.i18n.t('commands.add-ticker.no-ticker-specified'));
      return;
    }

    const tickers = ctx.session.subscriptionTickers ?? [];
    const reallyNew = _.without(addTickers, ...tickers);

    if (!reallyNew.length) {
      await ctx.reply(ctx.i18n.t('commands.add-ticker.duplicate'));
      return;
    }

    const poolResult = await PromisePool.for(reallyNew)
      .withConcurrency(10)
      .process(async t => {
        const asset = await this.assetService.findOne(t);
        const price = await this.yahooService.getPrices(t);

        if (!asset) {
          if (!price) {
            await ctx.reply(ctx.i18n.t('commands.add-ticker.not-found', { ticker: t }));
            return {
              ticker: t,
              apply: false,
            };
          }

          if (!price.regularMarketPrice) {
            await ctx.reply(ctx.i18n.t('commands.add-ticker.not-tradable', { ticker: t }));
            return {
              ticker: t,
              apply: false,
            };
          }
        }

        return {
          ticker: t,
          apply: true,
        };
      });

    const tickersToAdd = poolResult.results.filter(r => r.apply).map(r => r.ticker);

    if (tickersToAdd.length) {
      const newTickers = _.uniq([...tickers, ...tickersToAdd]).sort();
      ctx.session.subscriptionTickers = newTickers;

      await this.assetService.updateHistory(tickersToAdd);

      await ctx.reply(
        ctx.i18n.t('commands.add-ticker.success', { ticker: tickersToAdd.join(', ') }),
      );
    }
  }
}
