import _ = require('lodash');
import PromisePool = require('@supercharge/promise-pool/dist');

export type CatchDivideError<T> = {
  item: T;
  error: string;
};

export type CatchDivideResult<T, R> = {
  result: R;
  errors: CatchDivideError<T>[];
};

export async function catchDivide<T, R>(
  collection: T[],
  action: (arr: T[]) => Promise<R>,
  reduce?: (x: R, y: R) => R,
): Promise<CatchDivideResult<T, R>> {
  if (!reduce) {
    reduce = (x, y) => {
      if (_.isArray(x)) {
        return (_.concat(x as R, y) as any) as R;
      } else {
        return Object.assign(x, y);
      }
    };
  }

  // console.debug(`Catch divide with ${collection.length} items`);

  try {
    const result = await action(collection);
    return {
      result,
      errors: [],
    } as CatchDivideResult<T, R>;
  } catch (error) {
    if (!collection?.length) {
      throw new Error(`Action throws error on empty collection`);
    }

    if (collection.length === 1) {
      // console.debug(`Error on single item: ${collection[0]}`);

      return {
        result: null,
        errors: [
          {
            item: collection[0],
            error: error.message || error.toString?.() || JSON.stringify(error),
          },
        ],
      } as CatchDivideResult<T, R>;
    }

    // console.debug(`Error on ${collection.length} items`);

    const chunkSize = Math.max(1, Math.ceil(collection.length / 2));
    const chunks = _(collection).chunk(chunkSize).value();

    return await PromisePool.for(chunks)
      .withConcurrency(2)
      .process(chunk => catchDivide(chunk, action, reduce))
      .then(r => {
        const result = {
          result: null,
          errors: [],
        } as CatchDivideResult<T, R>;

        for (const chunkResult of r.results) {
          result.result = !result.result
            ? chunkResult.result
            : reduce(result.result, chunkResult.result);
          result.errors.push(...chunkResult.errors);
        }

        return result;
      });
  }
}
