import { Injectable } from '@nestjs/common';

type Environment = {
  name: string;
  bot_token: string;
  webhook_url: string;
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
}
