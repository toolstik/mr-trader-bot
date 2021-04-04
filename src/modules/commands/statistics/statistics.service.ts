import { Injectable } from '@nestjs/common';
import _ = require('lodash');

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
import { EventEntity } from '../../event/event.repository';
import { EventService } from '../../event/event.service';
import { EventEmitterService } from '../../global/event-emitter.service';
import { StatusTransitionEntity } from '../../status-transition/status-transition.repository';
import { StatusTransitionService } from '../../status-transition/status-transition.service';
import { flatMerge, recordMap } from '../utils';

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

@Injectable()
export class StatisticsService {
  constructor(
    private eventService: EventService,
    private eventEmitter: EventEmitterService,
    private assetService: AssetService,
    private transitionService: StatusTransitionService,
  ) {}

  private async getSignalStats(symbols: string[], global = false) {
    const transitionEvents = await this.getEvents({ tickers: symbols });

    const result = !global
      ? transitionEvents
      : Object.values(transitionEvents).reduce((prev, cur) => {
          if (!prev._global) {
            prev._global = [];
          }

          prev._global.push(...cur);
          return prev;
        }, {} as { _global: EventEntity[] });

    const signals = _(result)
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

  private async getProgressStats(symbols: string[], global = false) {
    const assets = await this.assetService.findByKeys(symbols);

    const progress = _(assets)
      .filter(a => a.state === 'REACH_TOP' || a.state === 'REACH_BOTTOM')
      .groupBy(a => (!global ? a.symbol : '_global'))
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

  async calcTickerStats(tickers: string[]) {
    const ctx = currentContext();

    const global = !tickers?.length;
    if (global) {
      tickers = ctx.session.subscriptionTickers;
    }

    const signals = await this.getSignalStats(tickers, global);
    const progress = await this.getProgressStats(tickers, global);

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

  private async getEvents(filters: { from?: Date; to?: Date; tickers?: string[] }) {
    const transitions = await this.transitionService.findByDateAndTickers(filters);

    const eventsTemp = _(transitions)
      .sortBy(t => t.createdAt)
      .reduce((prev, cur) => {
        const symbolData = prev[cur.event.symbol] || { openTransition: null, events: [] };

        if (cur.event.to === 'REACH_TOP' || cur.event.to === 'REACH_BOTTOM') {
          symbolData.openTransition = cur;
        } else if (
          cur.event.to === 'NONE' &&
          cur.event.from === symbolData.openTransition?.event.to
        ) {
          const event = {
            createdAt: cur.createdAt,
            symbol: cur.event.symbol,
            type: cur.event.from,
            openPrice: symbolData.openTransition.event.currentPrice,
            closePrice: cur.event.currentPrice,
          } as EventEntity;

          symbolData.openTransition = null;
          symbolData.events.push(event);
        }

        prev[cur.event.symbol] = symbolData;
        return prev;
      }, {} as Record<string, { openTransition: StatusTransitionEntity; events: EventEntity[] }>);

    return recordMap(eventsTemp, i => i.events);
  }
}
