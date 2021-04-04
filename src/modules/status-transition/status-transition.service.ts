import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AssetStatusChangedEvent } from '../../events/asset-status-changed.event';
import { BaseEntityService } from '../../services/base-entity.service';
import { newFirestoreId } from '../../utils/firebase';
import { StatusTransitionEntity, StatusTransitionRepository } from './status-transition.repository';

@Injectable()
export class StatusTransitionService extends BaseEntityService<StatusTransitionEntity> {
  constructor(private repository: StatusTransitionRepository) {
    super(repository);
  }

  async findByDateAndTickers(filters: { from?: Date; to?: Date; tickers?: string[] }) {
    return this.repository.find({
      createdAt: {
        ...(filters.from
          ? {
              $gte: filters.from,
            }
          : null),
        ...(filters.to
          ? {
              $lte: filters.to,
            }
          : null),
      },
      event: {
        symbol: {
          $in: filters.tickers,
        },
      },
    });
  }

  @OnEvent(AssetStatusChangedEvent.event)
  async handleStatusChange(event: AssetStatusChangedEvent) {
    const entity: StatusTransitionEntity = {
      id: newFirestoreId(),
      createdAt: new Date(),
      event,
    };

    await this.repository.saveOne(entity.id, entity);
  }
}
