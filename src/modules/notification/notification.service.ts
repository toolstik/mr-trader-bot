import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

import { AssetStatusChangedEvent } from '../../events/asset-status-changed.event';
import { MessageStatsCreatedEvent } from '../../events/message-stats-created.event';
import {
  AssetStatus,
  AssetStatusWithFundamentals,
  FundamentalData,
  paginate,
} from '../../types/commons';
import { MyContext, TgSession } from '../../types/my-context';
import { AnalysisService } from '../analysis/analysis.service';
import { AssetService } from '../asset/asset.service';
import { EventService } from '../event/event.service';
import { SessionService } from '../session/session.service';
import { TemplateService } from '../template/template.service';

import PromisePool = require('@supercharge/promise-pool');
import _ = require('lodash');

type AssetNotification<T> = {
  session: TgSession;
  data: T;
};

@Injectable()
export class NotificationService {
  constructor(
    private assetService: AssetService,
    private eventService: EventService,
    private sessionService: SessionService,
    private analysisService: AnalysisService,
    private templateService: TemplateService,
    @InjectBot() private bot: Telegraf<MyContext>,
  ) {}

  private async collectAndPlay<T>(
    collect: (ticket: string) => Promise<T | false>,
    play: (session: TgSession, ticker: string, data: T) => Promise<void>,
    sessions?: TgSession[],
    tickers?: string[],
  ) {
    sessions = sessions ?? (await this.sessionService.getSessions());
    const sessionsTickers = await this.sessionService.getSessionTickers(sessions);
    tickers = tickers ? _.intersection(tickers, sessionsTickers) : sessionsTickers;

    const dict = await PromisePool.withConcurrency(5)
      .for(tickers)
      .process(async ticker => {
        const collected = await collect(ticker);

        if (!collected) {
          return null;
        }

        return {
          ticker,
          collected,
        };
      })
      .then(r => {
        return r.results
          .filter(i => !!i)
          .reduce((prev, cur) => {
            return cur
              ? {
                  ...prev,
                  [cur.ticker]: cur.collected,
                }
              : prev;
          }, {} as Record<string, T>);
      });

    for (const session of sessions) {
      if (!session?.subscriptionTickers) {
        continue;
      }

      for (const ticker of session.subscriptionTickers) {
        const data = dict[ticker];
        if (data) {
          await play(session, ticker, data);
        }
      }
    }

    return dict;
  }

  private async prepareNotifications() {
    const notifications: AssetNotification<AssetStatusWithFundamentals>[] = [];

    const statuses = await this.collectAndPlay(
      async t => await this.analysisService.getAssetStatus(t),
      async (s, t, d) => {
        if (!d || !d.changed || d.status === 'NONE') {
          return;
        }

        const fundamentals = await this.assetService.getFundamentals(t);

        notifications.push({
          session: s,
          data: {
            ...d,
            fundamentals,
          },
        });
      },
    );

    return {
      notifications,
      statuses,
    };
  }

  async sendAssetStatusChangesAll(sessions?: TgSession[], tickers?: string[]) {
    sessions = sessions ?? (await this.sessionService.getSessions());
    const sessionsTickers = await this.sessionService.getSessionTickers(sessions);
    tickers = tickers ? _.intersection(tickers, sessionsTickers) : sessionsTickers;

    return await PromisePool.withConcurrency(5)
      .for(tickers)
      .process(async ticker => {
        return await this.analysisService.getAssetStatus(ticker, true);
      })
      .then(r => r.results);
  }

  async sendAssetStatusStateAll() {
    await this.collectAndPlay(
      async t => await this.analysisService.getAssetStatus(t),
      async (s, t, d) => {
        if (!d || d.status === 'NONE') {
          return;
        }

        const message = this.templateService.apply(`current_status`, d);
        await this.bot.telegram.sendMessage(s.chatId, message, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        });
      },
    );
  }

  async sendAssetStatusStatePages(sessions?: TgSession[]) {
    const chats: Record<string, AssetStatus[]> = {};

    await this.collectAndPlay(
      async t => await this.analysisService.getAssetStatus(t),
      async (s, t, d) => {
        if (!d || d.status === 'NONE') {
          return;
        }

        chats[s.chatId] = chats[s.chatId] || [];
        chats[s.chatId].push(d);
      },
      sessions,
    );

    const blocks = Object.entries(chats).map(([k, v]) => {
      return paginate(v, 15).map(p => {
        return {
          chatId: k,
          page: p,
        };
      });
    });

    await PromisePool.withConcurrency(10)
      .for(blocks)
      .process(async pages => {
        for (const p of pages) {
          const message = this.templateService.apply(`current_status_page`, p.page);
          await this.bot.telegram.sendMessage(p.chatId, message, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
          });
        }
      });
  }

  async sendAssetStatus(ctx: MyContext, status: AssetStatus) {
    const message = this.templateService.apply(`current_status`, status);
    return await ctx.replyWithMarkdown(message, {
      disable_web_page_preview: true,
    });
  }

  async sendAssetFundamentals(ctx: MyContext, data: FundamentalData) {
    const message = this.templateService.apply('fundamentals', data);
    return await ctx.replyWithMarkdown(message, {
      disable_web_page_preview: true,
    });
  }

  async sendAssetFundamentalsAll() {
    await this.collectAndPlay(
      async t => {
        const asset = await this.assetService.findOne(t);

        if (asset.state === 'NONE') {
          return false;
        }

        return await this.assetService.getFundamentals(t);
      },
      async (s, t, d) => {
        const message = this.templateService.apply('fundamentals', d);

        await this.bot.telegram.sendMessage(s.chatId, message, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        });
      },
    );
  }

  @OnEvent(MessageStatsCreatedEvent.event)
  async handleMessageStatsCreatedEvent(event: MessageStatsCreatedEvent) {
    const message = this.templateService.apply('stats', event);

    await this.bot.telegram.sendMessage(event.chatId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });
  }

  @OnEvent(AssetStatusChangedEvent.event)
  async handleAssetStatusChangedEvent(event: AssetStatusChangedEvent) {
    const recipients = await this.sessionService.getSessionsByTicker(event.symbol);

    if (!recipients?.length) {
      return;
    }

    const fundamentals = await this.assetService.getFundamentals(event.symbol);

    const data = {
      ticker: event.symbol,
      status: event.to,
      marketData: event.marketData,
      fundamentals,
    } as AssetStatusWithFundamentals;

    for (const n of recipients) {
      const message = this.templateService.apply(`change_status`, data);
      await this.bot.telegram.sendMessage(n.chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });
    }
  }
}
