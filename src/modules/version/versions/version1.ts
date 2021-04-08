import _ = require('lodash');
import { Injectable } from '@nestjs/common';
import { PartialDeep } from 'type-fest';

import { TgSession } from '../../../types/my-context';
import { defaultsDeep } from '../../commands/utils';
import { SessionRepository } from '../../session/session.repository';
import { AbstractVersion } from '../abstract-version';

@Injectable()
export class Version1 implements AbstractVersion {
  constructor(private sessionRepository: SessionRepository) {}

  async update() {
    const all = await this.sessionRepository.findAll();

    const defaults: PartialDeep<TgSession> = {
      enabled: true,
      subscriptionTickers: [],
      settings: {
        subscribeAll: true,
      },
    };

    _(all)
      .values()
      .flatMap(e => Object.values(e))
      .forEach(s => {
        _.mergeWith(s, defaults, defaultsDeep);
      });

    await this.sessionRepository.saveAll(all);
  }
}
