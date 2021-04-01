/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger } from '@nestjs/common';
import { logger } from 'firebase-functions';

@Injectable()
export class FirebaseLogger extends Logger {
  error(...args: any[]): void {
    logger.error(...args);
  }
  log(...args: any[]): void {
    logger.log(...args);
  }
  warn(...args: any[]): void {
    logger.warn(...args);
  }
  debug(...args: any[]): void {
    logger.debug(...args);
  }
  verbose(...args: any[]): void {
    logger.log(...args);
  }
}
