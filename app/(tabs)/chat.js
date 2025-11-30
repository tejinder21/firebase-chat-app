// app/(tabs)/chat.js
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import { Button, List, Text, TextInput } from 'react-native-paper';
import { auth, db } from '../../firebaseConfig';

// ---------- Helpers ----------

// yksi chatId kahdelle käyttäjälle
const getChatId = (a, b) => [a, b].sort().join('_');

const toDate = (ts) => (ts?.toDate ? ts.toDate() : new Date(ts));

// HH:MM
const formatTime = (ts) => {
  if (!ts) return '';
  const d = toDate(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// mode === 'short' → 09:22 / Yesterday / pvm
// mode === 'header' → Today / Yesterday / pvm
const formatDate = (ts, mode) => {
  if (!ts) return '';
  const d = toDate(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(d, today)) return mode === 'short' ? formatTime(ts) : 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString();
};

// ---------- Pääkomponentti ----------

export default function ChatScreen() {
  const { otherUid, otherName } = useLocalSearchParams();
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [recentChats, setRecentChats] = useState([]);

  const hasActiveChat = !!(currentUid && otherUid);
  const chatId = hasActiveChat ? getChatId(currentUid, otherUid) : null;
  const otherLabel = otherName || otherUid || 'User';
  const currentLabel =
    auth.currentUser?.displayName || auth.currentUser?.email || 'You';

  // 1) kuuntele viestit aktiivisesta chatista
  useEffect(() => {
    if (!hasActiveChat) return;

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) =>
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return unsub;
  }, [chatId, hasActiveChat]);

  // 2) recent-lista: kaikki chatit missä currentUid mukana
  useEffect(() => {
    if (!currentUid) return;

    const q = query(
      collection(db, 'chats'),
      where('users', 'array-contains', currentUid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((docSnap) => {
          const data = docSnap.data();
          const otherId = data.users?.find((u) => u !== currentUid);
          const otherInfo = data.participants?.[otherId];

          return {
            id: docSnap.id,
            otherUid: otherId,
            otherName: otherInfo?.displayName || otherId,
            lastMessage: data.lastMessage,
            updatedAt: data.updatedAt,
            unreadCount: data.unread?.[currentUid] || 0,
          };
        })
        .filter((item) => item.otherUid && item.lastMessage)
        .sort((a, b) => {
          const ta = a.updatedAt?.toMillis?.() ?? 0;
          const tb = b.updatedAt?.toMillis?.() ?? 0;
          return tb - ta;
        });

      setRecentChats(list);
    });

    return unsub;
  }, [currentUid]);

  // 3) kun avaan chatin → nollaa minun unread
  useEffect(() => {
    if (!hasActiveChat || !chatId || !currentUid) return;

    updateDoc(doc(db, 'chats', chatId), {
      [`unread.${currentUid}`]: 0,
    }).catch(() => {});
  }, [chatId, hasActiveChat, currentUid]);

  // 4) lähetä viesti
  const sendMessage = async () => {
    if (!hasActiveChat || !chatId || !currentUid || !otherUid) return;
    const textTrimmed = text.trim();
    if (!textTrimmed) return;

    try {
      const now = serverTimestamp();
      const chatRef = doc(db, 'chats', chatId);
      const otherDisplayName = otherName || otherUid;

      await setDoc(
        chatRef,
        {
          users: [currentUid, otherUid],
          updatedAt: now,
          participants: {
            [currentUid]: { displayName: currentLabel },
            [otherUid]: { displayName: otherDisplayName },
          },
          lastMessage: {
            text: textTrimmed,
            from: currentUid,
            to: otherUid,
            createdAt: now,
          },
        },
        { merge: true }
      );

      await updateDoc(chatRef, {
        [`unread.${otherUid}`]: increment(1),
      });

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: textTrimmed,
        from: currentUid,
        to: otherUid,
        createdAt: now,
      });

      setText('');
    } catch (err) {
      console.warn('Failed to send message:', err);
    }
  };

  // viestit + päiväotsikot
  const chatItems = useMemo(() => {
    const items = [];
    let lastHeader = null;

    messages.forEach((m) => {
      const header = formatDate(m.createdAt, 'header');
      if (header && header !== lastHeader) {
        items.push({ type: 'date', id: `d-${m.id}`, label: header });
        lastHeader = header;
      }
      items.push({ type: 'message', ...m });
    });

    return items;
  }, [messages]);

  // ei kirjautunut
  if (!currentUid) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Please sign in first.</Text>
      </View>
    );
  }

  // ei aktiivista chatia → recent-lista
  if (!hasActiveChat) {
    return (
      <RecentChatsView
        recentChats={recentChats}
        onOpenChat={(chat) =>
          router.push({
            pathname: '/(tabs)/chat',
            params: {
              otherUid: chat.otherUid,
              otherName: chat.otherName || chat.otherUid,
            },
          })
        }
      />
    );
  }

  // aktiivinen kahden hengen chat
  return (
    <ConversationView
      otherLabel={otherLabel}
      chatItems={chatItems}
      text={text}
      setText={setText}
      onSend={sendMessage}
      currentUid={currentUid}
    />
  );
}

// ---------- UI-komponentit ----------

function RecentChatsView({ recentChats, onOpenChat }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', padding: 16 }}>
      <Text
        style={{
          color: 'white',
          fontSize: 22,
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: 16,
        }}
      >
        Recent chats
      </Text>

      {recentChats.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: 'white' }}>
            No chats yet. Start from Contacts tab.
          </Text>
        </View>
      ) : (
        <FlatList
          data={recentChats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 8 }}
          renderItem={({ item }) => {
            const timeLabel = formatDate(
              item.lastMessage?.createdAt,
              'short'
            );
            const unread = item.unreadCount;

            return (
              <List.Item
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  marginBottom: 8,
                }}
                title={item.otherName || item.otherUid}
                titleStyle={{ fontWeight: '600' }}
                description={item.lastMessage?.text}
                right={() => (
                  <View
                    style={{
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      marginRight: 4,
                      marginTop: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: '#555',
                        marginBottom: unread > 0 ? 4 : 0,
                      }}
                    >
                      {timeLabel}
                    </Text>
                    {unread > 0 && (
                      <View
                        style={{
                          backgroundColor: '#180fc4ff',
                          borderRadius: 10,
                          minWidth: 18,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 12 }}>
                          {unread}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                onPress={() => onOpenChat(item)}
              />
            );
          }}
        />
      )}
    </View>
  );
}

function ConversationView({
  otherLabel,
  chatItems,
  text,
  setText,
  onSend,
  currentUid,
}) {
  const renderMessageItem = (item) => {
    const isMe = item.from === currentUid;

    return (
      <View
        style={{
          alignSelf: isMe ? 'flex-end' : 'flex-start',
          marginVertical: 4,
          marginHorizontal: 8,
          maxWidth: '80%',
        }}
      >
        <View
          style={{
            backgroundColor: isMe ? '#180fc4ff' : '#eeeeee',
            padding: 8,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: isMe ? 'white' : 'black' }}>{item.text}</Text>
          <Text
            style={{
              fontSize: 10,
              color: isMe ? '#e0e0ff' : '#666',
              marginTop: 4,
              textAlign: 'right',
            }}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderChatItem = ({ item }) =>
    item.type === 'date' ? (
      <View style={{ alignItems: 'center', marginVertical: 8 }}>
        <Text style={{ fontSize: 12, color: '#666' }}>{item.label}</Text>
      </View>
    ) : (
      renderMessageItem(item)
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={{ flex: 1, padding: 12, backgroundColor: '#f7f7f7' }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Chat with {otherLabel}
        </Text>

        <FlatList
          style={{ flex: 1 }}
          data={chatItems}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <TextInput
            mode="outlined"
            placeholder="Type a message..."
            value={text}
            onChangeText={setText}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            mode="contained"
            onPress={onSend}
            buttonColor="#180fc4ff"
            textColor="white"
          >
            Send
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
