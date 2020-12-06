import { database } from 'firebase-admin';
import { FirebaseService } from './firebase.service';

export type RefEntity<T> = Record<string, T>;

export abstract class ReferenceService<T> {
	protected readonly db: database.Database;
	protected readonly ref: database.Reference;

	constructor(firebase: FirebaseService) {
		this.db = firebase.getDatabase();
		this.ref = this.db.ref(this.getRefName());
	}

	protected abstract getRefName(): string;

	async getAll() {
		return (await this.ref.once('value')).val() as RefEntity<T>;
	}

	async getOne(key: string) {
		return (await this.ref.child(key).once('value')).val() as T;
	}

	async setAll(value: RefEntity<T>) {
		await this.ref.set(value);
	}

	async setOne(key: string, value: T) {
		await this.ref.child(key).set(value);
	}



}
