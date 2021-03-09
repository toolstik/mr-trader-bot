import { FirebaseRealtimeRepository } from './firebase-realtime.repository';

export abstract class BaseEntityService<T> {
  constructor(private __repository: FirebaseRealtimeRepository<T>) {}

  getOne(key: string) {
    return this.__repository.getOne(key);
  }

  updateOne(key: string, updateFn: (currentValue: T) => T) {
    return this.__repository.updateOne(key, updateFn);
  }
}
