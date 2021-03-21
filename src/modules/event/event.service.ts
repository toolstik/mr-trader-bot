import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AssetStatusChangedEvent } from '../../events/asset-status-changed.event';
import { BaseEntityService } from '../../services/base-entity.service';
import { newFirestoreId } from '../../utils/firebase';
import { SessionService } from '../session/session.service';
import { EventEntity, EventRepository } from './event.repository';

@Injectable()
export class EventService extends BaseEntityService<EventEntity> {
  constructor(private repository: EventRepository, private sessionService: SessionService) {
    super(repository);
  }

  async test() {
    await this.repository.setOne(null, { timestamp: new Date() } as EventEntity);
  }

  @OnEvent(AssetStatusChangedEvent.event)
  async handleStatusChange(event: AssetStatusChangedEvent) {
    const entity: EventEntity = {
      id: newFirestoreId(),
      timestamp: new Date(),
      symbol: event.symbol,
      oldStatus: event.from,
      newStatus: event.to,
      oldPrice: event.oldPrice,
      newPrice: event.currentPrice,
    };

    await this.repository.setOne(entity.id, entity);
  }
}
