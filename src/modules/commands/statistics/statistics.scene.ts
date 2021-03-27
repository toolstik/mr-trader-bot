import _ = require('lodash');
import { Scene, SceneEnter } from 'nestjs-telegraf';

import {
  MessageStatsCreatedEvent,
  Progress,
  ProgressStat,
  Signals,
  SignalStat,
  SignalStatValue,
} from '../../../events/message-stats-created.event';
import { currentContext } from '../../../utils/current-context';
import { AssetService } from '../../asset/asset.service';
import { EventService } from '../../event/event.service';
import { EventEmitterService } from '../../global/event-emitter.service';
import { flatMerge } from '../utils';

function mergeSum<T>(obj: T, src: T) {
  return flatMerge(obj, src, (path, left, right) => {
    if (typeof right === 'number') {
      return left === undefined ? right : left + right;
    }

    return right ?? left;
  });
}

@Scene(StatisticsScene.sceneName)
export class StatisticsScene {
  static sceneName = 'statistics';

  constructor(
    private eventService: EventService,
    private eventEmitter: EventEmitterService,
    private assetService: AssetService,
  ) {}

  @SceneEnter()
  async enter() {
    const ctx = currentContext();
    await this.process();
    await ctx.scene.leave();
  }

  private async getSignalStats() {
    const result = await this.eventService.findExitEvents({
      symbol: 'CAG',
    });

    console.log(result);

    const defaultStatValue: SignalStatValue = {
      count: 0,
      profit: 0,
    };

    const defaultStat: SignalStat = {
      positive: defaultStatValue,
      negative: defaultStatValue,
      total: defaultStatValue,
    };

    const defaultSignals: Signals = {
      top: defaultStat,
      bottom: defaultStat,
      total: defaultStat,
    };

    const signals = _(result)
      .map(e => {
        const positive =
          (e.type === 'REACH_TOP' && e.closePrice >= e.openPrice) ||
          (e.type === 'REACH_BOTTOM' && e.closePrice < e.openPrice);

        const stat: SignalStatValue = {
          count: 1,
          profit: (positive ? 1 : -1) * Math.abs(e.closePrice / e.openPrice - 1),
        };

        const topBottomKey: keyof Signals = e.type === 'REACH_TOP' ? 'top' : 'bottom';
        const positiveKey: keyof SignalStat = positive ? 'positive' : 'negative';

        return {
          ...defaultSignals,
          [topBottomKey]: {
            ...defaultStat,
            [positiveKey]: stat,
            total: stat,
          },
          total: {
            ...defaultStat,
            [positiveKey]: stat,
            total: stat,
          },
        } as Signals;
      })
      .reduce(mergeSum, {} as Signals);

    return signals;
  }

  private async getProgressStats() {
    const assets = await this.assetService.getAll();
    const progress = assets
      .filter(a => a.state === 'REACH_TOP' || a.state === 'REACH_BOTTOM')
      .map(a => {
        const stat: ProgressStat = {
          count: 1,
        };

        const defaultProgressValue: ProgressStat = {
          count: 0,
        };

        const defaultProgress: Progress = {
          top: defaultProgressValue,
          bottom: defaultProgressValue,
          total: defaultProgressValue,
        };

        const topBottomKey: keyof Progress = a.state === 'REACH_TOP' ? 'top' : 'bottom';

        return {
          ...defaultProgress,
          [topBottomKey]: stat,
          total: stat,
        } as Progress;
      })
      .reduce(mergeSum, {} as Progress);

    return progress;
  }

  private async process() {
    const ctx = currentContext();
    // const session = ctx.session;
    const signals = await this.getSignalStats();
    const progress = await this.getProgressStats();

    const event: MessageStatsCreatedEvent = {
      chatId: ctx.message.chat.id,
      ticker: 'CAG',
      signals,
      progress,
    };
    console.log('%j', event);
    await this.eventEmitter.emitAsync(MessageStatsCreatedEvent, event);
  }
}
