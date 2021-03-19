import { Injectable } from '@nestjs/common';

import { SessionService } from '../session/session.service';
import { EventEntity, EventRepository } from './event.repository';

import PromisePool = require('@supercharge/promise-pool/dist');
import { BaseEntityService } from '../../services/base-entity.service';

@Injectable()
export class EventService extends BaseEntityService<EventEntity> {
  private readonly HISTORY_DAYS_BACK = 20;

  constructor(private repository: EventRepository, private sessionService: SessionService) {
    super(repository);
  }

  async test() {
    await this.repository.setOne('example', { timestamp: new Date(), state: 'NONE' });
  }
}
