// app/(tabs)/profile.js
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Avatar,
  Button,
  Card,
  IconButton,
  Text,
  TextInput,
} from 'react-native-paper';

import { signOutUser } from '../../auth';
import { auth, db } from '../../firebaseConfig';

export default function Profile() {
  const user = auth.currentUser;

  // Nimi
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [displayName, setDisplayName] = useState(
    user?.displayName || 'USER'
  );
  const [draftName, setDraftName] = useState(user?.displayName || '');

  // Status / About me
  const [status, setStatus] = useState('');
  const [statusDraft, setStatusDraft] = useState('');
  const [editingStatus, setEditingStatus] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  // Haetaan status Firestoresta kerran
  useEffect(() => {
    if (!user?.uid) return;

    const loadStatus = async () => {
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          const s = data.status || '';
          setStatus(s);
          setStatusDraft(s);
        }
      } catch (e) {
        console.warn('Failed to load status:', e);
      }
    };

    loadStatus();
  }, [user?.uid]);

  const saveName = async () => {
    const newName = draftName.trim();
    if (newName.length < 2 || !auth.currentUser || !user?.uid) return;

    setSavingName(true);
    try {
      // Päivitä Firebase Auth -profiili
      await updateProfile(auth.currentUser, { displayName: newName });

      // Päivitä myös Firestore users -dokkarin displayName,
      // jotta contacts + recent chats näyttävät sen
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: newName,
      });

      setDisplayName(newName);
      setEditingName(false);
    } catch (e) {
      console.warn('Name update failed:', e);
    } finally {
      setSavingName(false);
    }
  };

  const saveStatus = async () => {
    if (!user?.uid) return;

    const newStatus = statusDraft.trim();
    setSavingStatus(true);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        status: newStatus,
      });
      setStatus(newStatus);
      setEditingStatus(false);
    } catch (e) {
      console.warn('Status update failed:', e);
    } finally {
      setSavingStatus(false);
    }
  };

  // Turva: jos ei kirjautunut
  if (!user) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.signInText}>Please sign in first.</Text>
      </View>
    );
  }

  const initial = (
    user.displayName?.trim()?.charAt(0) ??
    user.email?.trim()?.charAt(0) ??
    'U'
  ).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileCardContent}>
            {/* Avatar */}
            <Avatar.Text
              size={110}
              label={initial}
              style={styles.avatar}
            />

            {/* Nimi + editointi */}
            {!editingName ? (
              <View style={styles.nameRow}>
                <Text
                  variant="titleLarge"
                  style={styles.displayName}
                >
                  {displayName || 'USER'}
                </Text>
                <IconButton
                  icon="account-edit"
                  size={22}
                  onPress={() => {
                    setDraftName(displayName || '');
                    setEditingName(true);
                  }}
                />
              </View>
            ) : (
              <View style={styles.nameEditContainer}>
                <TextInput
                  mode="outlined"
                  label="Display name"
                  value={draftName}
                  onChangeText={setDraftName}
                  autoFocus
                  maxLength={40}
                />
                <View style={styles.rowButtons}>
                  <Button
                    mode="text"
                    style={styles.flexButton}
                    onPress={() => {
                      setEditingName(false);
                      setDraftName(displayName || '');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    style={[styles.flexButton, styles.saveButton]}
                    buttonColor="#180fc4ff"
                    onPress={saveName}
                    disabled={savingName || draftName.trim().length < 2}
                  >
                    {savingName ? 'Saving…' : 'Save'}
                  </Button>
                </View>
              </View>
            )}

            {/* Email */}
            <Text
              variant="bodyMedium"
              style={styles.emailText}
            >
              {user.email}
            </Text>

            {/* Info-kortti */}
            <Card style={styles.infoCard}>
              <Card.Content>
                <Text variant="bodyLarge">Email: {user.email}</Text>
                <Text variant="bodyLarge">
                  UID: {user.uid?.slice(0, 8)}...
                </Text>
              </Card.Content>
            </Card>

            {/* ABOUT ME / STATUS */}
            <Card style={styles.infoCard}>
              <Card.Content>
                {!editingStatus ? (
                  <>
                    <View style={styles.aboutHeaderRow}>
                      <Text
                        variant="titleSmall"
                        style={styles.aboutTitle}
                      >
                        About me
                      </Text>
                      <Button
                        compact
                        mode="text"
                        onPress={() => {
                          setStatusDraft(status);
                          setEditingStatus(true);
                        }}
                      >
                        Edit
                      </Button>
                    </View>

                    <Text
                      variant="bodyMedium"
                      style={styles.aboutText}
                    >
                      {status
                        ? status
                        : 'No status yet. Tell something about yourself.'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      variant="titleSmall"
                      style={styles.aboutTitleEditing}
                    >
                      About me
                    </Text>
                    <TextInput
                      mode="outlined"
                      multiline
                      numberOfLines={3}
                      value={statusDraft}
                      onChangeText={setStatusDraft}
                      placeholder="Write a short status..."
                    />
                    <View style={styles.rowButtons}>
                      <Button
                        mode="text"
                        style={styles.flexButton}
                        onPress={() => {
                          setEditingStatus(false);
                          setStatusDraft(status);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        mode="contained"
                        style={[styles.flexButton, styles.saveButton]}
                        buttonColor="#180fc4ff"
                        onPress={saveStatus}
                        disabled={savingStatus}
                      >
                        {savingStatus ? 'Saving…' : 'Save'}
                      </Button>
                    </View>
                  </>
                )}
              </Card.Content>
            </Card>

            {/* Sign out */}
            <Button
              mode="contained"
              style={styles.signOutButton}
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

const styles = StyleSheet.create({
  // Yleinen tausta
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
  },

  // Jos ei kirjautunut
  centeredContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    color: 'white',
  },

  // Profiilikortti
  profileCard: {
    borderRadius: 20,
  },
  profileCardContent: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  avatar: {
    backgroundColor: '#180fc4ff',
  },

  // Nimi
  nameRow: {
    alignItems: 'center',
  },
  displayName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  nameEditContainer: {
    width: '100%',
    marginTop: 4,
  },

  // Napit rivissä (Cancel / Save)
  rowButtons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  flexButton: {
    flex: 1,
  },
  saveButton: {
    marginLeft: 8,
    borderRadius: 24,
  },

  // Email-teksti
  emailText: {
    color: '#350dd4ff',
    marginTop: 4,
  },

  // Kortit (info + about)
  infoCard: {
    width: '100%',
    marginTop: 8,
    backgroundColor: '#f8f4ff',
  },

  // About me
  aboutHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  aboutTitle: {
    fontWeight: '600',
  },
  aboutTitleEditing: {
    fontWeight: '600',
    marginBottom: 6,
  },
  aboutText: {
    color: '#444',
  },

  // Sign out
  signOutButton: {
    marginTop: 16,
    borderRadius: 24,
    alignSelf: 'stretch',
  },
});
