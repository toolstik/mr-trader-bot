import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

import { Configuration } from '../global/configuration';

@Injectable()
export class FirebaseService {
  private readonly realtime: admin.database.Database;
  private readonly firestore: FirebaseFirestore.Firestore;

  constructor(private config: Configuration) {
    this.initialize();

    this.realtime = admin.database();

    this.firestore = admin.firestore();
    const firestoreSettings = this.getFirestoreSettings();
    if (firestoreSettings) {
      this.firestore.settings(firestoreSettings);
    }
  }

  protected initialize() {
    if (this.config.isEmulator && this.config.env.projectId) {
      const options: admin.AppOptions = {
        projectId: this.config.env.projectId,
        credential: admin.credential.cert(this.config.env.credential),
        databaseURL: this.config.env.databaseUrl,
      };

      admin.initializeApp(options);
    } else {
      admin.initializeApp();
    }
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
