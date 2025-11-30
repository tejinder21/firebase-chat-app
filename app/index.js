// app/index.js
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { signIn } from '../auth';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const canSubmit = !!email && !!password && !loading;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f172a' }} // 🌙 yönsininen
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>

        {/* Yläteksti */}
        <View style={{ marginBottom: 24 }}>
          <Text
            variant="headlineMedium"
            style={{
              color: 'white',
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            Welcome back 👋
          </Text>

          <Text
            variant="bodyMedium"
            style={{
              color: '#cbd5f5',      // vaalea sininen
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            Log in to continue chatting
          </Text>
        </View>

        {/* Kortti */}
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 20,
            gap: 12,
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
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
            <Text style={{ color: 'red', textAlign: 'center' }}>
              {error}
            </Text>
          )}

          <Button
            mode="contained"
            loading={loading}
            disabled={!canSubmit}
            onPress={handleLogin}
            style={{ borderRadius: 24, marginTop: 4 }}
            buttonColor="#180fc4ff"   // 💜 pääsävy (avatar-väri)
          >
            Log In
          </Button>

          <Button
            mode="text"
            onPress={() => router.push('/(tabs)/chat')}
            textColor="#180fc4ff"
          >
            Continue as guest
          </Button>
        </View>

        {/* Footer */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 16,
            gap: 6,
          }}
        >
          <Text style={{ color: 'white' }}>
            Don't have an account?
          </Text>

          <Button
            compact
            mode="text"
            onPress={() => router.push('/signUp')}
            textColor="#93c5fd"        // 💙 vaaleampi sininen
            contentStyle={{ paddingVertical: 0 }}
          >
            Sign Up
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
