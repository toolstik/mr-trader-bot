import { ContinuationLocalStorage } from 'asyncctx';

import { MyContext } from '../../types/my-context';

export class RequestContext {
  static CLS = new ContinuationLocalStorage<RequestContext>();

  static get currentContext() {
    return this.CLS.getContext();
  }

  readonly requestId: number;

  constructor(public readonly context: MyContext) {
    this.requestId = Date.now();
  }
}
