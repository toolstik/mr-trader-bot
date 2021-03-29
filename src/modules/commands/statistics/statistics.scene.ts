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
import { flatMerge, parseTickerList } from '../utils';

function mergeSum<T>(obj: T, src: T) {
  return flatMerge(obj, src, (path, left, right) => {
    if (typeof right === 'number') {
      return left === undefined ? right : left + right;
    }

    return right ?? left;
  });
}

const defaultProgressStat: ProgressStat = {
  count: 0,
};

const defaultProgress: Progress = {
  top: defaultProgressStat,
  bottom: defaultProgressStat,
  total: defaultProgressStat,
};

const defaultSignalStatValue: SignalStatValue = {
  count: 0,
  profit: 0,
};

const defaultSignalStat: SignalStat = {
  positive: defaultSignalStatValue,
  negative: defaultSignalStatValue,
  total: defaultSignalStatValue,
};

const defaultSignals: Signals = {
  top: defaultSignalStat,
  bottom: defaultSignalStat,
  total: defaultSignalStat,
};

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

  private async getSignalStats(symbols: string[]) {
    const result = await this.eventService.findExitEvents(symbols);

    const signals = _(result)
      .groupBy(i => i.symbol)
      .entries()
      .map(([symbol, events]) => {
        const symbolSignals = events
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
                ...defaultSignalStat,
                [positiveKey]: stat,
                total: stat,
              },
              total: {
                ...defaultSignalStat,
                [positiveKey]: stat,
                total: stat,
              },
            } as Signals;
          })
          .reduce(mergeSum, {} as Signals);

        return {
          [symbol]: symbolSignals,
        };
      })
      .reduce((prev, cur) => Object.assign(prev, cur), {} as Record<string, Signals>);

    return signals;
  }

  private async getProgressStats(symbols: string[]) {
    const assets = await this.assetService.findByKeys(symbols);
    const progress = _(assets)
      .filter(a => a.state === 'REACH_TOP' || a.state === 'REACH_BOTTOM')
      .groupBy(a => a.symbol)
      .entries()
      .map(([symbol, events]) => {
        const x = events
          .map(a => {
            const stat: ProgressStat = {
              count: 1,
            };

            const topBottomKey: keyof Progress = a.state === 'REACH_TOP' ? 'top' : 'bottom';

            return {
              ...defaultProgress,
              [topBottomKey]: stat,
              total: stat,
            } as Progress;
          })
          .reduce(mergeSum, {} as Progress);

        return {
          [symbol]: x,
        };
      })
      .reduce((prev, cur) => Object.assign(prev, cur), {} as Record<string, Progress>);

    return progress;
  }

  private async process() {
    const ctx = currentContext();
    const tickers = parseTickerList(ctx.state.command.args);

    const signals = await this.getSignalStats(tickers);
    const progress = await this.getProgressStats(tickers);

    let events: Record<string, MessageStatsCreatedEvent> = {};

    events = Object.entries(signals).reduce((prev, [key, value]) => {
      return {
        ...prev,
        [key]: {
          chatId: ctx.message.chat.id,
          ticker: key,
          progress: defaultProgress,
          ...prev[key],
          signals: value,
        },
      };
    }, events);

    events = Object.entries(progress).reduce((prev, [key, value]) => {
      return {
        ...prev,
        [key]: {
          chatId: ctx.message.chat.id,
          ticker: key,
          signals: defaultSignals,
          ...prev[key],
          progress: value,
        },
      };
    }, events);

    for (const e of Object.values(events)) {
      await this.eventEmitter.emitAsync(MessageStatsCreatedEvent, e);
    }
  }
}
