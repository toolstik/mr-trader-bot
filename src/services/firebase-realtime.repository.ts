import { ClassConstructor, classToPlain, plainToClass } from 'class-transformer';
import { database } from 'firebase-admin';
import _ = require('lodash');
import { Observable } from 'rxjs';
import { shareReplay, take } from 'rxjs/operators';

import { FirebaseService } from '../modules/firebase/firebase.service';
import { RefEntity, RefEntityObject } from '../types/commons';
import { IRepository } from './i-repository.interface';

// ".", "#", "$", "/", "[", or "]"
export function normalizeKey(key: string) {
  return key ? key.replace(/[.#$/\[\]]/, '_') : key;
}

export abstract class FirebaseRealtimeRepository<T> implements IRepository<T> {
  protected readonly db: database.Database;
  protected readonly ref: database.Reference;
  private state$: Observable<RefEntityObject>;

  constructor(firebase: FirebaseService) {
    this.db = firebase.getDatabase();
    this.ref = this.db.ref(this.getRefName());

    this.state$ = this.getStateObservable();
  }

  async find(query: Partial<T>): Promise<T[]> {
    const all = await this.findAll();

    const predicate = Object.keys(query)
      .map(key => {
        const value = query[key];

        if (_.isObject(value)) {
          if ('$in' in value) {
            const set = new Set(value['$in']);

            return (i: T) => {
              return set.has(i);
            };
          }
        }

        return (i: T) => {
          return i === value;
        };
      })
      .reduce(
        (prev, cur) => {
          return (i: T) => {
            return prev(i) && cur(i);
          };
        },
        () => true,
      );

    return Object.values(all).filter(predicate);
  }

  defaultId?(value: T): string {
    throw new Error('Method not implemented.');
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

  async findAll() {
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

  async findByKey(key: string) {
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

  async saveAll(value: RefEntity<T>) {
    const plain = this.manyToPlain(value);
    await this.ref.set(plain);
  }

  async saveOne(key: string, value: T) {
    const goodKey = normalizeKey(key);
    const plainValue = classToPlain(value);
    await this.ref.child(goodKey).set(plainValue);
  }

  async updateOne(key: string, updateFn: (currentValue: T) => T) {
    const current = await this.findByKey(key);
    const newValue = updateFn(current);
    await this.saveOne(key, newValue);
    return newValue;
  }

  async saveMany(update: RefEntity<T>) {
    const plain = this.manyToPlain(update ?? {});
    await this.ref.update(plain);
  }

  async updateMany(keys: string[], updateFn: (currentValue: T, key: string) => T) {
    const snapshot = await this.findAll();

    if (!keys?.length) {
      return;
    }

    for (const key of keys) {
      const currentValue = snapshot[key];
      const newValue = updateFn(currentValue, key);
      snapshot[key] = newValue;
    }

    return await this.saveAll(snapshot);
  }
}
