import { identity, uniq } from 'lodash';

export function parseTickerList(args: string) {
  const values = (args ?? '')
    .split(/[,; ]+/)
    .filter(identity)
    .map(i => i.toUpperCase());

  return uniq(values);
}
