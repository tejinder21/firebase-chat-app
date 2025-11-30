// app/_layout.js
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/(tabs)/chat'); // signed-in → tabs
      } else {
        router.replace('/');            // signed-out → login
      }
    });
    return unsub;
  }, []);

  return (
    <PaperProvider>
      <Stack>
        {/* Public routes */}
        <Stack.Screen name="index"  options={{ title: 'Sign In' }} />
        <Stack.Screen name="signUp" options={{ title: 'Sign Up' }} />
        {/* Private area (tabs) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </PaperProvider>
  );
}
