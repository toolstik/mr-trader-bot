import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

import { PlainLogger } from './modules/global/plain-logger';

@Catch()
export class AnyExceptionFilter implements ExceptionFilter {
  constructor(private log: PlainLogger) {}

  catch(exception: any, _host: ArgumentsHost) {
    // console.log('$$$$FILTERRRRR');
    // throw exception;
    this.log.error('ExceptionFilter caught error', exception);
  }
}
