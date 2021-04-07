import { Injectable } from '@nestjs/common';

type Environment = {
  name: string;
  bot_token: string;
  webhook_url: string;
  // projectId: string;
  // credential: string;
  // databaseUrl: string;
};

const CURRENT_VERSION = {
  versionNumber: 1,
  description: 'Menu initialization. Notification settings menu',
};

@Injectable()
export class Configuration {
  private readonly _env: Environment;

  constructor() {
    this._env = require('../../../env.json');
  }

  get env() {
    return this._env;
  }

  get isEmulator() {
    const { FUNCTIONS_EMULATOR } = process.env;
    return FUNCTIONS_EMULATOR === 'true';
  }

  get version() {
    return CURRENT_VERSION;
  }
}
