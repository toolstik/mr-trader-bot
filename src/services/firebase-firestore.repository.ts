import { FirebaseService } from '../modules/firebase/firebase.service';
import { newFirestoreId } from '../utils/firebase';
import { IRepository } from './i-repository.interface';

// ".", "#", "$", "/", "[", or "]"
function normalizeKey(key: string) {
  return key ? key.replace(/[.#$/\[\]]/, '_') : key;
}

export abstract class FirebaseFirestoreRepository<T> implements IRepository<T> {
  protected readonly db: FirebaseFirestore.Firestore;
  protected readonly ref: FirebaseFirestore.CollectionReference;

  constructor(firebaseService: FirebaseService) {
    this.db = firebaseService.getFirestore();
    this.ref = this.db.collection(this.getRefName());
  }

  defaultId(_value: T) {
    return newFirestoreId();
  }

  getAll(): Promise<Record<string, T>> {
    throw new Error('Method not implemented.');
  }
  getOne(key: string): Promise<T> {
    throw new Error('Method not implemented.');
  }
  setAll(value: Record<string, T>): Promise<void> {
    throw new Error('Method not implemented.');
  }
  setMany(update: Record<string, T>): Promise<void> {
    throw new Error('Method not implemented.');
  }
  updateOne(key: string, updateFn: (currentValue: T) => T): Promise<T> {
    throw new Error('Method not implemented.');
  }
  updateMany(keys: string[], updateFn: (currentValue: T, key: string) => T): Promise<void> {
    throw new Error('Method not implemented.');
  }

  protected abstract getRefName(): string;

  async setOne(key: string, value: T) {
    // const plainValue = classToPlain(value);

    if (!key) {
      await this.ref.add(value);
    } else {
      const goodKey = normalizeKey(key);
      await this.ref.doc(goodKey).set(value);
    }
  }
}
