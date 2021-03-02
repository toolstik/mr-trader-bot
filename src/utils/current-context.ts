import { RequestContext } from '../middlewares/request-context/request-context.model';

export function currentContext() {
  return RequestContext.currentContext.context;
}
