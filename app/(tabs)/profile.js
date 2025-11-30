// app/(tabs)/profile.js
import { updateProfile } from 'firebase/auth';
import { useState } from 'react';
import { View } from 'react-native';
import {
  Avatar,
  Button,
  Card,
  IconButton,
  Text,
  TextInput,
} from 'react-native-paper';
import { signOutUser } from '../../auth';
import { auth } from '../../firebaseConfig';

export default function Profile() {
  const user = auth.currentUser;

  if (!user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0f172a',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: 'white' }}>Please sign in first.</Text>
      </View>
    );
  }

  const initial = (
    user.displayName?.trim()?.charAt(0) ??
    user.email?.trim()?.charAt(0) ??
    'U'
  ).toUpperCase();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || 'USER');
  const [draftName, setDraftName] = useState(user.displayName || '');

  const saveName = async () => {
    const newName = draftName.trim();
    if (newName.length < 2 || !auth.currentUser) return;

    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: newName });
      setDisplayName(newName);
      setEditing(false);
    } catch (e) {
      console.warn('Name update failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', paddingHorizontal: 24 }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Card style={{ borderRadius: 20 }}>
          <Card.Content
            style={{ alignItems: 'center', gap: 16, paddingVertical: 24 }}
          >
            <Avatar.Text
              size={110}
              label={initial}
              style={{ backgroundColor: '#180fc4ff' }}
            />

            {!editing ? (
              <View style={{ alignItems: 'center' }}>
                <Text
                  variant="titleLarge"
                  style={{ fontWeight: '700', marginBottom: 4 }}
                >
                  {displayName || 'USER'}
                </Text>
                <IconButton
                  icon="account-edit"
                  size={22}
                  onPress={() => {
                    setDraftName(displayName || '');
                    setEditing(true);
                  }}
                />
              </View>
            ) : (
              <View style={{ width: '100%', marginTop: 4 }}>
                <TextInput
                  mode="outlined"
                  label="Display name"
                  value={draftName}
                  onChangeText={setDraftName}
                  autoFocus
                  maxLength={40}
                />
                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                  <Button
                    mode="text"
                    style={{ flex: 1 }}
                    onPress={() => {
                      setEditing(false);
                      setDraftName(displayName || '');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    style={{ flex: 1, marginLeft: 8, borderRadius: 24 }}
                    buttonColor="#180fc4ff"
                    onPress={saveName}
                    disabled={saving || draftName.trim().length < 2}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                </View>
              </View>
            )}

            <Text
              variant="bodyMedium"
              style={{ color: '#350dd4ff', marginTop: 4 }}
            >
              {user.email}
            </Text>

            <Card
              style={{
                width: '100%',
                marginTop: 8,
                backgroundColor: '#ffffffff',
              }}
            >
              <Card.Content>
                <Text variant="bodyLarge">Email: {user.email}</Text>
                <Text variant="bodyLarge">
                  UID: {user.uid?.slice(0, 8)}...
                </Text>
              </Card.Content>
            </Card>

            <Button
              mode="contained"
              style={{ marginTop: 16, borderRadius: 24, alignSelf: 'stretch' }}
              buttonColor="#180fc4ff"
              textColor="white"
              onPress={signOutUser}
            >
              Sign Out
            </Button>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}
