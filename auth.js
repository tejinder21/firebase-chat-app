// auth.js
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

// Create account (optionally set displayName)
export async function signUp(email, password, displayName) {
  // 1) luodaan käyttäjä Authenticationiin
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // 2) päivitetään displayName Authiin (jos annettu)
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }

  // 3) lisätään käyttäjä Firestoreen "users"-kokoelmaan
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: displayName || '',
    createdAt: serverTimestamp(),
  });

  return cred.user;
}

// Sign in
export async function signIn(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

// Sign out
export function signOutUser() {
  return signOut(auth);
}

// Auth state listener (returns unsubscribe)
export function onAuth(cb) {
  return onAuthStateChanged(auth, cb);
}
