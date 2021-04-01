import { Injectable } from '@nestjs/common';
import { Composer } from 'telegraf';
import { MiddlewareObj } from 'telegraf/typings/middleware';

import { PlainLogger } from '../modules/global/plain-logger';
import { MyContext } from '../types/my-context';

@Injectable()
export class ResponseTimeMiddleware implements MiddlewareObj<MyContext> {
  constructor(private log: PlainLogger) {}

  middleware() {
    return Composer.on('text', async (ctx, next) => {
      const start = Date.now();
      this.log.debug(
        `(${ctx.update.update_id}) Message from '${ctx.from.username || ctx.from.id}': ${
          ctx.message.text
        }`,
      );
      await next();
      this.log.debug(`(${ctx.update.update_id}) Message processing time: ${Date.now() - start}ms`);
    });
  }
}
