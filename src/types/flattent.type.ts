import { UnionToIntersection } from "telegraf/typings/telegram-types";
import { ConditionalExcept, Get, Primitive } from "type-fest";

type Delimiter = '.';

type NonObjectTypes = Primitive | Date | any[];

type IsObject<T> = T extends NonObjectTypes ? false : true;

type PrefixedKeys<T, Prefix extends string> = IsObject<T> extends true
  ? Prefix extends ''
    ? keyof T
    : `${Prefix}${Delimiter}${Extract<keyof T, string>}`
  : never;

type RemovePrefix<K extends string, Prefix extends string> = Prefix extends ''
  ? K
  : K extends `${Prefix}${Delimiter}${infer Tail}`
  ? Tail
  : never;

type Prefixize<T, Prefix extends string> = IsObject<T> extends true
  ? {
      [K in PrefixedKeys<T, Prefix>]: T[RemovePrefix<K, Prefix>];
    }
  : never;

type IsFlat<T> = keyof ConditionalExcept<T, NonObjectTypes> extends never ? true : false;

type ObjectKeys<T> = Extract<keyof ConditionalExcept<T, NonObjectTypes>, string>;

type FlatOne<T> = Omit<T, ObjectKeys<T>> &
  UnionToIntersection<
    {
      [K in ObjectKeys<T>]: Prefixize<T[K], K>;
    }[ObjectKeys<T>]
  >;

// type Paths<T> = IsFlat<T> extends true ? keyof T : Paths<FlatOne<T>>;

// type Flatten<T> = {
//   [K in Paths<T>]: Get<T, Extract<K, string>>;
// };

// type z = Flatten<Signals>;
