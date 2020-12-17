import { Injectable } from "@nestjs/common";
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {

	constructor() {
		// admin.initializeApp();
	}

	getDatabase() {
		return admin.database();
	}

}
