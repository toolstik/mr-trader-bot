import { RefEntity } from '../types/commons';

export interface IRepository<T> {
  getAll(): Promise<RefEntity<T>>;

  getOne(key: string): Promise<T>;

  setAll(value: RefEntity<T>): Promise<void>;

  setMany(update: RefEntity<T>): Promise<void>;

  setOne(key: string, value: T): Promise<void>;

  updateOne(key: string, updateFn: (currentValue: T) => T): Promise<T>;

  updateMany(keys: string[], updateFn: (currentValue: T, key: string) => T): Promise<void>;

  defaultId?(value: T): string;
}
