import { IRepository } from './i-repository.interface';

export abstract class BaseEntityService<T> {
  constructor(private __repository: IRepository<T>) {}

  getOne(key: string) {
    return this.__repository.getOne(key);
  }

  updateOne(key: string, updateFn: (currentValue: T) => T) {
    return this.__repository.updateOne(key, updateFn);
  }
}
