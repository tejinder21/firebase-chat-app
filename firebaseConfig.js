// firebaseConfig.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyA4ijIxdvXORFcO9p8AVKPSQdrDssCL6Fc',
  authDomain: 'fir-chat-1085e.firebaseapp.com',
  projectId: 'fir-chat-1085e',
  storageBucket: 'fir-chat-1085e.firebasestorage.app',
  messagingSenderId: '619356778803',
  appId: '1:619356778803:web:ebeb6d4719d0ca7ae98e46',
};

// Varmistetaan, ettei initializeAppia kutsuta moneen kertaan (esim. hot reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firestore — käytetään kontakteissa, chatissa jne.
export const db = getFirestore(app);

// Auth React Native -persistenssillä
let authInstance;

try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Esim. hot reload: auth on jo alustettu → käytetään olemassa olevaa instanssia
  authInstance = getAuth(app);
}

export const auth = authInstance;

// Storage (jos haluat myöhemmin kuvia tms.)
export const storage = getStorage(app);

export default app;
