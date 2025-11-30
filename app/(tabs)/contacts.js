// app/(tabs)/contacts.js
import { useRouter } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Avatar, List, Text, TextInput } from 'react-native-paper';
import { auth, db } from '../../firebaseConfig';

export default function ContactsScreen() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  // Hae kaikki muut käyttäjät
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const currentUid = auth.currentUser?.uid;

      const others = snapshot.docs
        .filter((doc) => doc.id !== currentUid)
        .map((doc) => ({ id: doc.id, ...doc.data() }));

      setUsers(others);
    });

    return unsub;
  }, []);

  // Suodata hakusanan mukaan
  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (u.displayName || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const renderItem = ({ item }) => {
    // ✅ Valitaan ensin järkevä lähde alkukirjaimelle
    const nameSource =
      item.displayName && item.displayName.trim().length > 0
        ? item.displayName.trim()
        : item.email?.trim() || 'U';

    const initial = nameSource.charAt(0).toUpperCase();

    return (
      <List.Item
        style={{
          backgroundColor: '#ffffff',
          marginBottom: 8,
          borderRadius: 16,
        }}
        title={item.displayName || 'User'}
        description={item.email}
        left={() => (
          <Avatar.Text
            size={44}
            label={initial}
            style={{ backgroundColor: '#180fc4ff' }}
          />
        )}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/chat',
            params: {
              otherUid: item.id,
              otherName: item.displayName || item.email,
            },
          })
        }
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', padding: 16 }}>
      {/* Yksi selkeä otsikko kuten login/profiili */}
      <Text
        style={{
          color: 'white',
          fontSize: 22,
          fontWeight: '700',
          textAlign: 'center',
          marginTop: 8,
          marginBottom: 4,
        }}
      >
        Start a chat with your friends
      </Text>

      {/* Hakukenttä suoraan tummalla taustalla */}
      <TextInput
        mode="outlined"
        placeholder="Search by name or email"
        value={search}
        onChangeText={setSearch}
        left={<TextInput.Icon icon="magnify" />}
        style={{
          marginTop: 16,
          marginBottom: 12,
          backgroundColor: '#ffffff',
        }}
      />

      {filteredUsers.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          {users.length === 0 ? (
            <Text style={{ color: 'white' }}>No other users yet.</Text>
          ) : (
            <Text style={{ color: 'white' }}>No matches for your search.</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 8 }}
        />
      )}
    </View>
  );
}
