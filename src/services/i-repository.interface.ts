import { RefEntity } from '../types/commons';

type Condition<T> =
  | T
  | {
      $in: T[];
    };

export type FindQuery<T> = {
  [K in keyof T]?: Condition<T[K]>;
};

export interface IRepository<T> {
  findAll(): Promise<RefEntity<T>>;

  findByKey(key: string): Promise<T>;

  find(query: FindQuery<T>): Promise<T[]>;

  saveAll(value: RefEntity<T>): Promise<void>;

  saveMany(update: RefEntity<T>): Promise<void>;

  saveOne(key: string, value: T): Promise<void>;

  updateOne(key: string, updateFn: (currentValue: T) => T): Promise<T>;

  updateMany(keys: string[], updateFn: (currentValue: T, key: string) => T): Promise<void>;

  defaultId?(value: T): string;
}
