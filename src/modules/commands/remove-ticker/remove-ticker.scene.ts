import PromisePool = require('@supercharge/promise-pool/dist');
import _ = require('lodash');
import { Scene, SceneEnter } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { parseTickerList } from '../utils';

type TickerStatus = 'remove' | 'not_found';

@Scene(RemoveTickerScene.sceneName)
export class RemoveTickerScene {
  static sceneName = 'remove-ticker';

  @SceneEnter()
  async enter() {
    const ctx = currentContext();
    await this.process();
    await ctx.scene.leave();
  }

  private async process() {
    const ctx = currentContext();

    const removeTickers = parseTickerList(ctx.state.command.args);

    if (!removeTickers?.length) {
      await ctx.reply(ctx.i18n.t('commands.remove-ticker.no-ticker-specified'));
      return;
    }

    const tickers = ctx.session.subscriptionTickers ?? [];

    const poolResult = await PromisePool.for(removeTickers)
      .withConcurrency(10)
      .process<{ ticker: string; status: TickerStatus }>(async t => {
        const exists = tickers.includes(t);

        if (!exists) {
          return {
            ticker: t,
            status: 'not_found',
          };
        }

        return {
          ticker: t,
          status: 'remove',
        };
      });

    const tickersToRemove = poolResult.results
      .filter(r => r.status === 'remove')
      .map(r => r.ticker);
    const tickersNotFound = poolResult.results
      .filter(r => r.status === 'not_found')
      .map(r => r.ticker);

    if (tickersNotFound.length) {
      await ctx.reply(
        ctx.i18n.t('commands.remove-ticker.not-found', { ticker: tickersNotFound.join(', ') }),
      );
    }

    if (tickersToRemove.length) {
      const newTickers = _.without(tickers, ...tickersToRemove).sort();
      ctx.session.subscriptionTickers = newTickers;

      await ctx.reply(
        ctx.i18n.t('commands.remove-ticker.success', { ticker: tickersToRemove.join(', ') }),
      );
    }
  }
}
