// app/_layout.js
import { Stack, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';

import { auth, db } from '../firebaseConfig';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Merkitään käyttäjä online-tilaan ja päivitetään lastSeen
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            online: true,
            lastSeen: serverTimestamp(),
          });
        } catch (e) {
          console.warn('Failed to update presence:', e);
        }

        // Kirjautunut → tabs/ chat
        router.replace('/(tabs)/chat');
      } else {
        // Ei kirjautunut → login
        router.replace('/');
      }
    });

    return unsubscribe;
  }, [router]);

  return (
    <PaperProvider>
      <Stack>
        <Stack.Screen name="index"  options={{ title: 'Sign In' }} />
        <Stack.Screen name="signUp" options={{ title: 'Sign Up' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </PaperProvider>
  );
}
