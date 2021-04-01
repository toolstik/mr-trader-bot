import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  constructor() {
    this.initialize();
  }

  protected initialize() {
    admin.initializeApp();
  }

  getDatabase() {
    return admin.database();
  }

  getFirestore() {
    return admin.firestore();
  }
}
