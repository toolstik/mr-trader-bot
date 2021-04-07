import { MiddlewareFn } from 'telegraf/typings/middleware';

import { MyContext } from '../../types/my-context';
import { RequestContext } from './request-context.model';

/**
 * This is needed to side-step Nest.js, which doesn't support getting the current execution context (i.e. Request) that's
 * not from the Controller handles directly (and passing it down explicitly). This means that things like a Logger can't
 * use DI to get the current user (if any).
 *
 * This solution is taken from https://github.com/nestjs/nest/issues/699#issuecomment-405868782.
 */
export const requestContextMiddleware: MiddlewareFn<MyContext> = async (
  ctx: MyContext,
  next: () => Promise<void>,
) => {
  console.log('###update', ctx.updateType, ctx.update);
  const requestContext = new RequestContext(ctx);
  RequestContext.CLS.setContext(requestContext);
  await next();
};
