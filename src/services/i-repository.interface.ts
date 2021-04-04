import { RefEntity } from '../types/commons';

type Condition<T> = {
  $lt?: T;
  $lte?: T;
  // $eq?: T;
  // $ne?: T;
  // $not?: T;
  $gt?: T;
  $gte?: T;
  // $exists?: boolean;
  $in?: T[];
  // $nin?: T[];
  // $type?: 'null' | 'boolean' | 'number' | 'string' | 'array' | 'object';
};

export type ConditionKey = keyof Condition<any>;

export function isCondition<T>(selector: Selector<T>): selector is Condition<T> {
  return !!Object.keys(selector).find(k => k.startsWith('$'));
}

type Combination<T> = {
  // $and?: Selector<T>[];
  // $or?: Selector<T>[];
  // $nor?: Selector<T>[];
  // $not?: Selector<T>;
  // $all?: Selector<T>[];
  // $elemMatch?: Selector<T>;
  // $allMatch?: Selector<T>;
};

type Operator<T> = Condition<T> | Combination<T>;

export type Selector<T> =
  | Operator<T>
  | (T extends object
      ? {
          [F in keyof T]?: Selector<T[F]>;
        }
      : T);

export interface IRepository<T> {
  findAll(): Promise<RefEntity<T>>;

  findByKey(key: string): Promise<T>;

  find(query: Selector<T>): Promise<T[]>;

  saveAll(value: RefEntity<T>): Promise<void>;

  saveMany(update: RefEntity<T>): Promise<void>;

  saveOne(key: string, value: T): Promise<void>;

  updateOne(key: string, updateFn: (currentValue: T) => T): Promise<T>;

  updateMany(keys: string[], updateFn: (currentValue: T, key: string) => T): Promise<void>;

  defaultId?(value: T): string;

  normalizeKey(key: string): string;
}
