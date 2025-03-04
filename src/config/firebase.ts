import * as firebase from 'firebase/app';
import admin, { ServiceAccount } from 'firebase-admin';
import * as dotenv from 'dotenv';
import { logger } from '..';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
};

export const firebaseApp = firebase.initializeApp(firebaseConfig);

const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

logger.info('serviceAccount:', serviceAccount);

export const firebaseAdminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
