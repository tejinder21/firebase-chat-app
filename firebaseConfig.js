// firebaseConfig.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // 👈 TÄMÄ LISÄTTY
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyA4ijIxdvXORFcO9p8AVKPSQdrDssCL6Fc',
  authDomain: 'fir-chat-1085e.firebaseapp.com',
  projectId: 'fir-chat-1085e',
  storageBucket: 'fir-chat-1085e.firebasestorage.app',
  messagingSenderId: '619356778803',
  appId: '1:619356778803:web:ebeb6d4719d0ca7ae98e46',
};

const app = initializeApp(firebaseConfig);

// Firestore-instanssi — tätä käytetään contactsissa, chatissa jne.
export const db = getFirestore(app);

// Auth-instanssi React Native -persistenssillä
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // esim. hot reloadin aikana, jos auth on jo alustettu
  authInstance = getAuth(app);
}
export const storage = getStorage(app); 

export const auth = authInstance;

export default app;
