import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private readonly realtime: admin.database.Database;
  private readonly firestore: FirebaseFirestore.Firestore;

  constructor() {
    this.initialize();

    this.realtime = admin.database();

    this.firestore = admin.firestore();
    const firestoreSettings = this.getFirestoreSettings();
    if (firestoreSettings) {
      this.firestore.settings(firestoreSettings);
    }
  }

  protected initialize() {
    admin.initializeApp();
  }

  protected getFirestoreSettings(): FirebaseFirestore.Settings {
    return { ignoreUndefinedProperties: true };
  }

  getDatabase() {
    return this.realtime;
  }

  getFirestore() {
    return this.firestore;
  }
}
