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
