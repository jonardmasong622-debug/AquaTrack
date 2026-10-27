import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { Platform } from 'react-native';
// React-Native persistence lives in @firebase/auth (same module instance firebase/auth re-exports).
import { getReactNativePersistence } from '@firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './config/firebaseConfig';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Keep native users signed in with AsyncStorage; use Firebase's browser persistence on web.
let auth: Auth = Platform.OS === 'web' ? getAuth(app) : getNativeAuth();

function getNativeAuth(): Auth {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'auth/already-initialized') {
      return getAuth(app);
    }
    throw error;
  }
}

let db: Firestore;
try {
  db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
} catch {
  db = getFirestore(app);
}

export { app, auth, db };
