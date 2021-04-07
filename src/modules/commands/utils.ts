/* eslint-disable @typescript-eslint/no-explicit-any */
import flatten = require('flat');
import { identity, uniq } from 'lodash';
import _ = require('lodash');

export function parseTickerList(args: string) {
  const values = (args ?? '')
    .split(/[,; ]+/)
    .filter(identity)
    .map(i => i.toUpperCase());

  return uniq(values);
}

export function recordMap<
  InKey extends string | number | symbol,
  InValue,
  OutKey extends string | number | symbol,
  OutValue
>(
  record: Record<InKey, InValue>,
  valueFunc: (x: InValue) => OutValue,
  keyFunc: (x: InKey) => OutKey = identity,
): Record<OutKey, OutValue> {
  return Object.entries(record).reduce((prev, [key, value]) => {
    const newKey = keyFunc(key as InKey);
    const newValue = valueFunc(value as InValue);
    prev[newKey] = newValue;
    return prev;
  }, {} as Record<OutKey, OutValue>);
}

export function flatMerge<T extends Object>(
  obj: T,
  src: T,
  modifier?: (path: string, left: any, right: any) => any,
) {
  const srcFlatKeys = Object.keys(flatten(src));

  modifier = modifier || ((path, left, right) => (right !== undefined ? right : left));

  for (const key of srcFlatKeys) {
    const srcValue = _.get(src, key);
    const objValue = _.get(obj, key);

    const value = modifier(key, objValue, srcValue);

    _.set(obj, key, value);
  }
  return obj;
}

export function clone<T>(x: T) {
  return JSON.parse(JSON.stringify(x)) as T;
}

export function defaultsDeep<T>(dest: T, src: T, key?: string): T {
  // console.log(key, dest, src);

  if (dest === undefined) {
    return src;
  }

  if (_.isArray(dest)) {
    return dest;
  }

  if (typeof dest === 'object') {
    return _.mergeWith(dest, src, defaultsDeep);
  }

  return dest;
}
