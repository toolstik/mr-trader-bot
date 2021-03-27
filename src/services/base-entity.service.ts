import { IRepository } from './i-repository.interface';

export abstract class BaseEntityService<T> {
  constructor(private __repository: IRepository<T>) {}

  async getAll() {
    const record = await this.__repository.findAll();
    return Object.values(record);
  }

  getOne(key: string) {
    return this.__repository.findByKey(key);
  }

  updateOne(key: string, updateFn: (currentValue: T) => T) {
    return this.__repository.updateOne(key, updateFn);
  }
}
