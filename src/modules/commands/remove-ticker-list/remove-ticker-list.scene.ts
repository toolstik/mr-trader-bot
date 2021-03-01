import _ = require('lodash');
import { Scene, SceneEnter } from 'nestjs-telegraf';

import { currentContext } from '../../../utils/current-context';
import { AssetListService } from '../../asset-list/asset-list.service';

@Scene(RemoveTickerListScene.sceneName)
export class RemoveTickerListScene {
  static sceneName = 'remove-ticker-list';

  constructor(private assetListService: AssetListService) {}

  @SceneEnter()
  async enter() {
    const ctx = currentContext();
    await this.process();
    await ctx.scene.leave();
  }

  private async process() {
    const ctx = currentContext();
    const args = ctx.state.command.splitArgs;

    const listKey = (args.filter(t => !!t)[0] || '').toLowerCase();

    if (!listKey) {
      await ctx.reply(ctx.i18n.t('commands.remove-ticker-list.no-list-specified'), {
        parse_mode: 'Markdown',
      });
      return;
    }

    if (!this.assetListService.isKnownList(listKey)) {
      await ctx.reply(ctx.i18n.t('commands.remove-ticker-list.unknown-list'), {
        parse_mode: 'Markdown',
      });
      return;
    }

    const removeTickers = await this.assetListService.getListTickers(listKey);
    const tickers = ctx.session.subscriptionTickers ?? [];
    const tickersToRemove = _.intersection(removeTickers, tickers);

    if (tickersToRemove.length) {
      const newTickers = _.without(tickers, ...tickersToRemove).sort();
      ctx.session.subscriptionTickers = newTickers;

      await ctx.reply(
        ctx.i18n.t('commands.remove-ticker-list.success', {
          key: listKey,
        }),
        {
          parse_mode: 'Markdown',
        },
      );
    }
  }
}
