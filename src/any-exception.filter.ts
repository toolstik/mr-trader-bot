import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch()
export class AnyExceptionFilter implements ExceptionFilter {
  catch(exception: any, _host: ArgumentsHost) {
    // console.log('$$$$FILTERRRRR');
    throw exception;
  }
}
