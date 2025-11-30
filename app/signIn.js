// app/signIn.js
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16 }}>
        <Text variant="headlineMedium" style={{ textAlign: 'center', fontWeight: '700' }}>
          Sign in
        </Text>
        <Text style={{ textAlign: 'center', color: '#6b7280' }}>
          Welcome back! Please enter your credentials to sign in.
        </Text>

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

        <Button mode="contained" disabled onPress={() => {}}>
          Sign In
        </Button>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          <Text>Don't have an account?</Text>
          <Button compact mode="text" onPress={() => router.push('/signUp')}>
            Sign Up
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
