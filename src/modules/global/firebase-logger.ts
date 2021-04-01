/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { logger } from 'firebase-functions';

import { PlainLogger } from './plain-logger';

@Injectable()
export class FirebaseLogger extends PlainLogger {
  error(...args: any[]): void {
    logger.error(...args);
  }
  info(...args: any[]): void {
    logger.info(...args);
  }
  warn(...args: any[]): void {
    logger.warn(...args);
  }
  debug(...args: any[]): void {
    logger.debug(...args);
  }
}
