// app/signUp.js
import { useRouter } from 'expo-router';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
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

  const handleGoToLogin = () => {
    router.push('/');
  };

  const handleSignUp = async () => {
    setError('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Luo käyttäjä Firebase Authiin
      const user = await signUp(
        email.trim(),
        password,
        name.trim() || undefined
      );

      // Talleta käyttäjä myös Firestoreen contacts-listaa varten
      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || name || 'User',
          createdAt: serverTimestamp(),
        });
      }

      // _layout hoitaa muutenkin redirectin, mutta varmistetaan
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
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.card}>
          <Text
            variant="headlineMedium"
            style={styles.title}
          >
            Create account
          </Text>

          <Text style={styles.subtitle}>
            Sign up to start chatting
          </Text>

          <TextInput
            mode="outlined"
            label="Name (optional)"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <TextInput
            mode="outlined"
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          {!!error && (
            <Text style={styles.errorText}>
              {error}
            </Text>
          )}

          <Button
            mode="contained"
            loading={loading}
            disabled={loading}
            onPress={handleSignUp}
            style={styles.signUpButton}
            buttonColor="#180fc4ff"
          >
            Sign Up
          </Button>

          <View style={styles.footerRow}>
            <Text>Already have an account?</Text>
            <Button
              compact
              mode="text"
              onPress={handleGoToLogin}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#555',
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 8,
  },
  signUpButton: {
    marginTop: 16,
    borderRadius: 24,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 4,
  },
});
