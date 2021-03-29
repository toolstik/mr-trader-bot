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

  async findExitEvents(symbols: string[]) {
    return await this.repository.find({
      symbol: {
        $in: symbols,
      },
    });
  }

  @OnEvent(AssetStatusChangedEvent.event)
  async handleStatusChange(event: AssetStatusChangedEvent) {
    if (event.to !== 'NONE') {
      return;
    }

    const entity: EventEntity = {
      id: newFirestoreId(),
      type:
        event.from === 'REACH_TOP'
          ? 'REACH_TOP'
          : event.from === 'REACH_BOTTOM'
          ? 'REACH_BOTTOM'
          : undefined,
      createdAt: new Date(),
      symbol: event.symbol,
      //  openTime: event.
      openPrice: event.oldPrice,
      closePrice: event.currentPrice,
    };

    await this.repository.saveOne(entity.id, entity);
  }
}
