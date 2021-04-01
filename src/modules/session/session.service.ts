import { Injectable } from '@nestjs/common';

import { TgSession } from '../../types/my-context';
import _ = require('lodash');
import { SessionRepository } from './session.repository';

@Injectable()
export class SessionService {
  constructor(private repository: SessionRepository) {}

  async getSessions() {
    const sessionRefValue = await this.repository.findAll();
    return _.flatten(Object.values(sessionRefValue).map(sv => Object.values(sv)));
  }

  async getSessionsByTicker(symbol: string) {
    const sessions = await this.getSessions();
    return sessions.filter(s => s.subscriptionTickers?.find(t => t === symbol) !== null);
  }

  async getSessionTickers(sessions?: TgSession[]) {
    sessions = sessions ?? (await this.getSessions());
    return _.uniq(_.flatten(sessions.map(s => s.subscriptionTickers)));
  }
}
