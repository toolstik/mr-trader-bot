/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';

@Injectable()
export class PlainLogger {
  error(...args: any[]): void {
    console.error(...args);
  }
  info(...args: any[]): void {
    console.info(...args);
  }
  warn(...args: any[]): void {
    console.warn(...args);
  }
  debug(...args: any[]): void {
    console.debug(...args);
  }
}
