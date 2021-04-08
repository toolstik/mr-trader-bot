import _ = require('lodash');
import { Injectable, OnModuleInit, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { PlainLogger } from '../global/plain-logger';
import { AbstractVersion, REGISTERED_VERSIONS } from './abstract-version';
import { VersionEntity, VersionInfo, VersionRepository } from './version.repository';

type UpdatableVersion = VersionInfo & {
  type: Type<AbstractVersion>;
};

@Injectable()
export class VersionService implements OnModuleInit {
  private readonly stateKey = 'state';

  constructor(
    private log: PlainLogger,
    private repository: VersionRepository,
    private moduleRef: ModuleRef,
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
    const actualVersions = _(REGISTERED_VERSIONS)
      .entries()
      .map(([key, value]) => {
        return {
          ...value,
          num: Number(key),
        } as UpdatableVersion;
      })
      .sortBy(v => v.num)
      .value();

    for (const version of actualVersions) {
      await this.updateToVersion(version);
    }
  }

  async updateToVersion(version: UpdatableVersion) {
    const state = await this.getState();

    // just skip old versions
    if (version.num <= state.current) {
      return;
    }

    if (version.num !== state.current + 1) {
      throw new Error(
        `Application can not be updated to version ${version.num}. Current version is ${
          state.current
        } but ${version.num - 1} expected. Versions have to be installed sequentially`,
      );
    }

    try {
      const instance = await this.moduleRef.create(version.type);
      await instance.update();

      state.current = version.num;
      state.installed[version.num] = {
        num: version.num,
        description: version.description,
        installDate: new Date(),
      };

      await this.saveState(state);

      this.log.info(`Application has been updated to version ${version.num}`);
    } catch (e) {
      this.log.error(`Error ocurred while updating to version ${version.num}`, e);
      throw e;
    }
  }
}
