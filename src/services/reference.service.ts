import { ClassConstructor, classToPlain, plainToClass } from 'class-transformer';
import { database } from 'firebase-admin';
import { RefEntity, RefEntityObject } from '../types/commons';
import { FirebaseService } from './firebase.service';


// ".", "#", "$", "/", "[", or "]"
export function normalizeKey(key: string) {
	return key ? key.replace(/[.#$/\[\]]/, '_') : key;
}

export abstract class ReferenceService<T> {
	protected readonly db: database.Database;
	protected readonly ref: database.Reference;

	constructor(firebase: FirebaseService) {
		this.db = firebase.getDatabase();
		this.ref = this.db.ref(this.getRefName());
	}

	protected abstract getRefName(): string;

	protected abstract getEntityType(): ClassConstructor<T>;

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
		const goodKey = normalizeKey(key);
		const snapshot = await this.ref.child(goodKey).once('value');
		const value = snapshot.val() as Object;
		const entityType = this.getEntityType();
		return plainToClass(entityType, value);
	}

	async setAll(value: RefEntity<T>) {
		const entityType = this.getEntityType();

		const goodValue = Object.entries(value)
			.reduce((prev, [key, val]) => {
				return {
					...prev,
					[normalizeKey(key)]: val,
				}
			}, {});

		const plain = classToPlain(goodValue, {
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
		})
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



}
