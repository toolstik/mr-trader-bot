import PromisePool = require('@supercharge/promise-pool/dist');
import _ = require('lodash');
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AssetStatusChangedEvent } from '../../events/asset-status-changed.event';
import { BaseEntityService } from '../../services/base-entity.service';
import { Selector } from '../../services/i-repository.interface';
import { paginate } from '../../types/commons';
import { newFirestoreId } from '../../utils/firebase';
import { StatusTransitionEntity, StatusTransitionRepository } from './status-transition.repository';

@Injectable()
export class StatusTransitionService extends BaseEntityService<StatusTransitionEntity> {
  constructor(private repository: StatusTransitionRepository) {
    super(repository);
  }

  async findByDateAndTickers(filters: { from?: Date; to?: Date; tickers?: string[] }) {
    const selector: Selector<StatusTransitionEntity> = {
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
    };

    if (filters?.tickers) {
      const poolResult = await PromisePool.for(paginate(filters.tickers, 10))
        .withConcurrency(5)
        .process(async page => {
          const pageSelector: Selector<StatusTransitionEntity> = {
            ...selector,
            event: {
              symbol: {
                $in: page.items,
              },
            },
          };
          return await this.repository.find(pageSelector);
        });

      return _(poolResult.results).flatten().value();
    } else {
      return await this.repository.find(selector);
    }
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
