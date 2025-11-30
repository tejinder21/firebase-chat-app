// app/signUp.js
import { useRouter } from 'expo-router';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { signUp } from '../auth';
import { auth, db } from '../firebaseConfig';

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError('');
    if (!email || !password) {
      return setError('Email and password are required.');
    }
    if (password !== confirm) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      // luo käyttäjä Firebase Authiin
      const user = await signUp(email.trim(), password, name.trim() || undefined);

      // talleta käyttäjä myös Firestoreen contacts-listaa varten
      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || name || 'User',
          createdAt: serverTimestamp(),
        });
      }

      // _layout hoitaa automaattisen redirectin,
      // mutta varmuuden vuoksi:
      if (auth.currentUser) {
        router.replace('/(tabs)/chat');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f172a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 24,
            padding: 24,
          }}
        >
          <Text
            variant="headlineMedium"
            style={{ textAlign: 'center', fontWeight: '700', marginBottom: 8 }}
          >
            Create account
          </Text>

          <Text
            style={{
              textAlign: 'center',
              color: '#555',
              marginBottom: 16,
            }}
          >
            Sign up to start chatting
          </Text>

          <TextInput
            mode="outlined"
            label="Name (optional)"
            value={name}
            onChangeText={setName}
            style={{ marginBottom: 8 }}
          />
          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginBottom: 8 }}
          />
          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ marginBottom: 8 }}
          />
          <TextInput
            mode="outlined"
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          {!!error && (
            <Text
              style={{
                color: 'red',
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              {error}
            </Text>
          )}

          <Button
            mode="contained"
            loading={loading}
            disabled={loading}
            onPress={handleSignUp}
            style={{ marginTop: 16, borderRadius: 24 }}
            buttonColor="#180fc4ff"
          >
            Sign Up
          </Button>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 12,
              gap: 4,
            }}
          >
            <Text>Already have an account?</Text>
            <Button
              compact
              mode="text"
              onPress={() => router.push('/')}
              textColor="#180fc4ff"
            >
              Sign In
            </Button>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
