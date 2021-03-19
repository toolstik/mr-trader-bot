import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

admin.initializeApp();

@Injectable()
export class FirebaseService {
  // constructor() { }

  getDatabase() {
    return admin.database();
  }

  getFirestore() {
    return admin.firestore();
  }
}
