import _ = require('lodash');
import { FirebaseService } from '../modules/firebase/firebase.service';
import { newFirestoreId } from '../utils/firebase';
import { ConditionKey, IRepository, isCondition, Selector } from './i-repository.interface';

// ".", "#", "$", "/", "[", or "]"
function normalizeKey(key: string) {
  return key ? key.replace(/[.#$/\[\]]/, '_') : key;
}

export abstract class FirebaseFirestoreRepository<T> implements IRepository<T> {
  protected readonly db: FirebaseFirestore.Firestore;
  protected readonly ref: FirebaseFirestore.CollectionReference<T>;

  constructor(firebaseService: FirebaseService) {
    this.db = firebaseService.getFirestore();
    this.ref = this.db.collection(this.getRefName()) as FirebaseFirestore.CollectionReference<T>;
  }

  normalizeKey(key: string): string {
    return key;
  }

  private buildQuery<U>(query: FirebaseFirestore.Query<U>, selector: Selector<U>, prefix: string) {
    if (!_.isObject(selector)) {
      return query.where(prefix, '==', selector);
    }

    if (!isCondition(selector)) {
      query = Object.keys(selector).reduce((prev, key) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return this.buildQuery(prev, selector[key], path);
      }, query);
    } else {
      query = Object.keys(selector).reduce((prev, key: ConditionKey) => {
        if (key === '$in') {
          prev = prev.where(prefix, 'in', selector[key]);
        }
        if (key === '$gt') {
          prev = prev.where(prefix, '>', selector[key]);
        }
        if (key === '$gte') {
          prev = prev.where(prefix, '>=', selector[key]);
        }
        if (key === '$lt') {
          prev = prev.where(prefix, '<', selector[key]);
        }
        if (key === '$lte') {
          prev = prev.where(prefix, '<=', selector[key]);
        }

        return prev;
      }, query);
    }

    return query;
  }

  async find(query: Selector<T>): Promise<T[]> {
    const request = this.buildQuery(this.ref, query, null);

    const snapshot = await request.get();

    return snapshot.empty ? [] : snapshot.docs.map(d => d.data());
  }

  defaultId(_value: T) {
    return newFirestoreId();
  }

  findAll(): Promise<Record<string, T>> {
    throw new Error('Method not implemented.');
  }
  findByKey(key: string): Promise<T> {
    throw new Error('Method not implemented.');
  }
  saveAll(value: Record<string, T>): Promise<void> {
    throw new Error('Method not implemented.');
  }
  saveMany(update: Record<string, T>): Promise<void> {
    throw new Error('Method not implemented.');
  }
  updateOne(key: string, updateFn: (currentValue: T) => T): Promise<T> {
    throw new Error('Method not implemented.');
  }
  updateMany(keys: string[], updateFn: (currentValue: T, key: string) => T): Promise<void> {
    throw new Error('Method not implemented.');
  }

  protected abstract getRefName(): string;

  async saveOne(key: string, value: T) {
    // const plainValue = classToPlain(value);

    if (!key) {
      await this.ref.add(value);
    } else {
      const goodKey = normalizeKey(key);
      await this.ref.doc(goodKey).set(value);
    }
  }
}
