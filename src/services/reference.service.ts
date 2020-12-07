import { classToPlain, plainToClass, Type } from 'class-transformer';
import { ClassType } from 'class-transformer/ClassTransformer';
import { database } from 'firebase-admin';
import { FirebaseService } from './firebase.service';

export type RefEntity<T> = Record<string, T>;

class RefEntityObject {
	[key: string]: Object;
}

export abstract class ReferenceService<T> {
	protected readonly db: database.Database;
	protected readonly ref: database.Reference;

	constructor(firebase: FirebaseService) {
		this.db = firebase.getDatabase();
		this.ref = this.db.ref(this.getRefName());
	}

	protected abstract getRefName(): string;

	protected abstract getEntityType(): ClassType<T>;

	async getAll() {
		const snapshot = await this.ref.once('value');
		const value = (snapshot.val() ?? {}) as Object;
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
		const snapshot = await this.ref.child(key).once('value');
		const value = snapshot.val() as Object;
		const entityType = this.getEntityType();
		return plainToClass(entityType, value);
	}

	async setAll(value: RefEntity<T>) {
		const entityType = this.getEntityType();
		const plain = classToPlain(value, {
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
		})
		await this.ref.set(plain);
	}

	async setOne(key: string, value: T) {
		await this.ref.child(key).set(value);
	}



}
