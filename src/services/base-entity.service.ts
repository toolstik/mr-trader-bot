import { FirebaseRealtimeRepository } from './firebase-realtime.repository';

export abstract class BaseEntityService<T> {
  constructor(private __repository: FirebaseRealtimeRepository<T>) {}

  get getOne() {
    return this.__repository.getOne;
  }

  get updateOne() {
    return this.__repository.updateOne;
  }
}
