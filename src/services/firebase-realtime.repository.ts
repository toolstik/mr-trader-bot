import _ = require('lodash');
import { ClassConstructor, classToPlain, plainToClass } from 'class-transformer';
import { database } from 'firebase-admin';
import { Observable } from 'rxjs';
import { shareReplay, take } from 'rxjs/operators';

import { createObject, recordMap } from '../modules/commands/utils';
import { FirebaseService } from '../modules/firebase/firebase.service';
import { RefEntity, RefEntityObject } from '../types/commons';
import { plainToRecord, recordToPlain } from '../utils/record-transform';
import { IRepository } from './i-repository.interface';

export abstract class FirebaseRealtimeRepository<T> implements IRepository<T> {
  protected readonly db: database.Database;
  protected readonly ref: database.Reference;
  protected readonly state$: Observable<RefEntity<T>>;

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

  // ".", "#", "$", "/", "[", or "]"
  normalizeKey(key: string) {
    return key ? key.replace(/[.#$/\[\]]/, '_') : key;
  }

  defaultId?(value: T): string {
    throw new Error('Method not implemented.');
  }

  protected abstract getRefName(): string;

  protected abstract getEntityType(): ClassConstructor<T>;

  private getStateObservable() {
    return new Observable<RefEntity<T>>(subj => {
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
    return plainToRecord(entityType, value);
  }

  async findByKey(key: string) {
    const goodKey = this.normalizeKey(key);
    const value = await this.getSnapshotValue().then(i => i[goodKey]);
    const entityType = this.getEntityType();
    return plainToClass(entityType, value);
  }

  private manyToPlain(value: RefEntity<T>) {
    const entityType = this.getEntityType();

    value = recordMap(
      value,
      v => v,
      k => this.normalizeKey(k),
    );

    value = createObject(RefEntityObject, value) as RefEntity<T>;

    return recordToPlain(entityType, value);
  }

  async saveAll(value: RefEntity<T>) {
    const plain = this.manyToPlain(value);
    await this.ref.set(plain);
  }

  async saveOne(key: string, value: T) {
    const goodKey = this.normalizeKey(key);
    value = plainToClass(this.getEntityType(), value);
    // console.log(value.constructor.name);
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
