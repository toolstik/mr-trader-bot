import { IRepository } from './i-repository.interface';

export abstract class BaseEntityService<T> {
  constructor(private __repository: IRepository<T>) {}

  async findAll() {
    const record = await this.__repository.findAll();
    return Object.values(record);
  }

  async findByKeys(symbols: string[]) {
    const all = await this.__repository.findAll();
    return symbols?.map(i => all[i]);
  }

  findOne(key: string) {
    return this.__repository.findByKey(key);
  }

  updateOne(key: string, updateFn: (currentValue: T) => T) {
    return this.__repository.updateOne(key, updateFn);
  }
}
