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

export function recordMap<T, U>(record: Record<string, T>, func: (x: T) => U): Record<string, U> {
  return Object.entries(record).reduce((prev, [key, value]) => {
    prev[key] = func(value);
    return prev;
  }, {} as Record<string, U>);
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
