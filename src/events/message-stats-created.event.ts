export type SignalStatValue = {
  count: number;
  profit: number;
};

export type SignalStat = {
  positive: SignalStatValue;
  negative: SignalStatValue;
  total: SignalStatValue;
};

export type Signals = {
  top: SignalStat;
  bottom: SignalStat;
  total: SignalStat;
};

export type ProgressStat = {
  count: number;
};

export type Progress = {
  top: ProgressStat;
  bottom: ProgressStat;
  total: ProgressStat;
};

export class MessageStatsCreatedEvent {
  static readonly event = 'message.stats.created';

  chatId: string | number;

  ticker: string;

  signals: Signals;

  progress: Progress;
}
