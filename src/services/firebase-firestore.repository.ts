import { FirebaseService } from '../modules/firebase/firebase.service';
import { newFirestoreId } from '../utils/firebase';
import { FindQuery, IRepository } from './i-repository.interface';

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

  async find(query: FindQuery<T>): Promise<T[]> {
    const request = Object.keys(query).reduce((prev, key) => {
      return prev.where(key, '==', query[key]);
    }, this.ref as FirebaseFirestore.Query<T>);

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
