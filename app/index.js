// app/index.js
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

import { signIn } from '../auth';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = !!email && !!password && !loading;

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/chat');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    router.push('/(tabs)/chat');
  };

  const handleGoToSignUp = () => {
    router.push('/signUp');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Welcome back 👋
          </Text>

          <Text variant="bodyMedium" style={styles.subtitle}>
            Log in to continue chatting
          </Text>
        </View>

        {/* Login card */}
        <View style={styles.card}>
          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
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
            disabled={!canSubmit}
            onPress={handleLogin}
            style={styles.loginButton}
            buttonColor="#180fc4ff"
          >
            Log In
          </Button>

          <Button
            mode="text"
            onPress={handleGuest}
            textColor="#180fc4ff"
          >
            Continue as guest
          </Button>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?
          </Text>

          <Button
            compact
            mode="text"
            onPress={handleGoToSignUp}
            textColor="#93c5fd"
            contentStyle={styles.footerButtonContent}
          >
            Sign Up
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a', // tumma sininen tausta
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#cbd5f5',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  loginButton: {
    borderRadius: 24,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  footerText: {
    color: 'white',
  },
  footerButtonContent: {
    paddingVertical: 0,
  },
});
