import { Injectable, OnModuleInit } from '@nestjs/common';

import { Configuration } from '../global/configuration';
import { PlainLogger } from '../global/plain-logger';
import { SessionService } from '../session/session.service';
import { VersionEntity, VersionInfo, VersionRepository } from './version.repository';

@Injectable()
export class VersionService implements OnModuleInit {
  private readonly stateKey = 'state';

  constructor(
    private log: PlainLogger,
    private repository: VersionRepository,
    private config: Configuration,
    private sessionService: SessionService,
  ) {}

  private async getState() {
    const snapshot = await this.repository.findByKey(this.stateKey);

    return (
      snapshot || {
        current: 0,
        installed: {},
      }
    );
  }

  private async saveState(value: VersionEntity) {
    return await this.repository.saveOne(this.stateKey, value);
  }

  async onModuleInit() {
    await this.upgrade();
  }

  async upgrade() {
    await this.updateToVersion(
      {
        num: 1,
        description: 'Menu initialization. Notification settings menu',
      },
      () => this.updateTo1(),
    );
  }

  async updateToVersion(verInfo: VersionInfo, updateFunc: () => Promise<void>) {
    const state = await this.getState();

    if (verInfo.num <= state.current) {
      return;
    }

    if (verInfo.num !== state.current + 1) {
      throw new Error(
        `Application can not be updated to version ${verInfo.num}. Current version is ${
          state.current
        } but ${verInfo.num - 1} expected. Versions have to be installed sequentially`,
      );
    }

    await updateFunc();

    state.current = verInfo.num;
    state.installed[verInfo.num] = {
      ...verInfo,
      installDate: new Date(),
    };

    await this.saveState(state);

    this.log.info(`Application has been updated to version ${verInfo.num}`, verInfo);
  }

  private async updateTo1() {
    console.log('##### UPDATE');
  }
}
