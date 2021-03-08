import { ClassConstructor, classToPlain, plainToClass } from 'class-transformer';
import { database } from 'firebase-admin';
import { Observable } from 'rxjs';
import { shareReplay, take } from 'rxjs/operators';

import { FirebaseService } from '../modules/firebase/firebase.service';
import { RefEntity, RefEntityObject } from '../types/commons';

// ".", "#", "$", "/", "[", or "]"
export function normalizeKey(key: string) {
  return key ? key.replace(/[.#$/\[\]]/, '_') : key;
}

export abstract class FirebaseRealtimeRepository<T> {
  protected readonly db: database.Database;
  protected readonly ref: database.Reference;
  private state$: Observable<RefEntityObject>;

  constructor(firebase: FirebaseService) {
    this.db = firebase.getDatabase();
    this.ref = this.db.ref(this.getRefName());

    this.state$ = this.getStateObservable();
  }

  protected abstract getRefName(): string;

  protected abstract getEntityType(): ClassConstructor<T>;

  private getStateObservable() {
    return new Observable<RefEntityObject>(subj => {
      this.ref.on(
        'value',
        snapshot => {
          subj.next(snapshot.val());
        },
        error => {
          subj.error(error);
        },
      );
    }).pipe(shareReplay(1));
  }

  private getSnapshotValue() {
    return this.state$
      .pipe(take(1))
      .toPromise()
      .then(i => i ?? {});
  }

  async getAll() {
    const value = await this.getSnapshotValue();
    const entityType = this.getEntityType();
    return plainToClass(RefEntityObject, value, {
      targetMaps: [
        {
          target: RefEntityObject,
          properties: Object.keys(value).reduce((prev, cur) => {
            return {
              ...prev,
              [cur]: entityType,
            };
          }, {}),
        },
      ],
    }) as RefEntity<T>;
  }

  async getOne(key: string) {
    const goodKey = normalizeKey(key);
    const value = await this.getSnapshotValue().then(i => i[goodKey]);
    const entityType = this.getEntityType();
    return plainToClass(entityType, value);
  }

  private manyToPlain(value: RefEntity<T>) {
    const entityType = this.getEntityType();

    const goodValue = Object.entries(value).reduce((prev, [key, val]) => {
      return Object.assign(prev, {
        [normalizeKey(key)]: val,
      });
    }, new RefEntityObject());

    return classToPlain(goodValue, {
      targetMaps: [
        {
          target: RefEntityObject,
          properties: Object.keys(goodValue).reduce((prev, cur) => {
            return {
              ...prev,
              [cur]: entityType,
            };
          }, {}),
        },
      ],
    });
  }

  async setAll(value: RefEntity<T>) {
    const plain = this.manyToPlain(value);
    await this.ref.set(plain);
  }

  async setOne(key: string, value: T) {
    const goodKey = normalizeKey(key);
    const plainValue = classToPlain(value);
    await this.ref.child(goodKey).set(plainValue);
  }

  async updateOne(key: string, updateFn: (currentValue: T) => T) {
    const current = await this.getOne(key);
    const newValue = updateFn(current);
    await this.setOne(key, newValue);
    return newValue;
  }

  async setMany(update: RefEntity<T>) {
    const plain = this.manyToPlain(update ?? {});
    await this.ref.update(plain);
  }

  async updateMany(keys: string[], updateFn: (currentValue: T, key: string) => T) {
    const snapshot = await this.getAll();

    if (!keys?.length) {
      return;
    }

    for (const key of keys) {
      const currentValue = snapshot[key];
      const newValue = updateFn(currentValue, key);
      snapshot[key] = newValue;
    }

    return await this.setAll(snapshot);
  }
}
