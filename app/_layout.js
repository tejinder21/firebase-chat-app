
import { Stack, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';

import { auth } from '../firebaseConfig';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Kuuntele kirjautumistilaa ja ohjaa käyttäjä oikeaan näkymään
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Kirjautunut → suoraan appin tabs-puolelle
        router.replace('/(tabs)/chat');
      } else {
        // Ei kirjautunut → login-näkymä
        router.replace('/');
      }
    });

    return unsubscribe;
  }, [router]);

  return (
    <PaperProvider>
      <Stack>
        {/* Julkiset näkymät */}
        <Stack.Screen name="index"  options={{ title: 'Sign In' }} />
        <Stack.Screen name="signUp" options={{ title: 'Sign Up' }} />

        {/* Kirjautunut alue (tabs) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </PaperProvider>
  );
}
