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
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, List, Text, TextInput } from 'react-native-paper';

import { auth, db } from '../../firebaseConfig';
import { runSlashCommand } from '../../services/chatCommands'; // ⬅ uusi import

// ---------- Apufunktiot ----------

// Yksi pysyvä chatId kahdelle käyttäjälle
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

  // 1) Kuuntele viestit aktiivisesta chatista
  useEffect(() => {
    if (!hasActiveChat || !chatId) return;

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(list);
    });

    return unsubscribe;
  }, [chatId, hasActiveChat]);

  // 2) Recent-lista: kaikki chatit, joissa currentUid mukana
  useEffect(() => {
    if (!currentUid) return;

    const q = query(
      collection(db, 'chats'),
      where('users', 'array-contains', currentUid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
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

    return unsubscribe;
  }, [currentUid]);

  // 3) Kun avaan chatin → nollaa minun unread-laskuri
  useEffect(() => {
    if (!hasActiveChat || !chatId || !currentUid) return;

    updateDoc(doc(db, 'chats', chatId), {
      [`unread.${currentUid}`]: 0,
    }).catch(() => {
      // ei kaadeta UI:ta vaikka epäonnistuisi
    });
  }, [chatId, hasActiveChat, currentUid]);

  // 4) Lähetä viesti (+ slash-komennot runSlashCommandin kautta)
  const sendMessage = async () => {
    if (!hasActiveChat || !chatId || !currentUid || !otherUid) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    let messageText = trimmed;

    try {
      // jos viesti alkaa slash-komennolla, annetaan service-kerroksen käsitellä se
      const slashResult = await runSlashCommand(trimmed);
      if (slashResult) {
        messageText = slashResult;
      }

      const now = serverTimestamp();
      const chatRef = doc(db, 'chats', chatId);
      const otherDisplayName = otherName || otherUid;

      // Päivitä/luo chat-dokumentti
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
            text: messageText,
            from: currentUid,
            to: otherUid,
            createdAt: now,
          },
        },
        { merge: true }
      );

      // Nosta vastaanottajan unread-laskuria
      await updateDoc(chatRef, {
        [`unread.${otherUid}`]: increment(1),
      });

      // Lisää viesti messages-alakokoelmaan
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: messageText,
        from: currentUid,
        to: otherUid,
        createdAt: now,
      });

      setText('');
    } catch (err) {
      console.warn('Failed to send message:', err);
    }
  };

  // Viestit + päiväotsikot samaan listaan
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

  // Ei kirjautunut
  if (!currentUid) {
    return (
      <View style={styles.centered}>
        <Text>Please sign in first.</Text>
      </View>
    );
  }

  // Ei aktiivista chatia → näytä recent-lista
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

  // Aktiivinen kahden hengen chat
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
    <View style={styles.recentContainer}>
      <Text style={styles.recentTitle}>Recent chats</Text>

      {recentChats.length === 0 ? (
        <View style={styles.recentEmpty}>
          <Text style={styles.recentEmptyText}>
            No chats yet. Start from Contacts tab.
          </Text>
        </View>
      ) : (
        <FlatList
          data={recentChats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.recentListContent}
          renderItem={({ item }) => {
            const timeLabel = formatDate(item.lastMessage?.createdAt, 'short');
            const unread = item.unreadCount;

            return (
              <List.Item
                style={styles.recentItem}
                title={item.otherName || item.otherUid}
                titleStyle={styles.recentItemTitle}
                description={item.lastMessage?.text}
                right={() => (
                  <View style={styles.recentRight}>
                    <Text
                      style={[
                        styles.recentTime,
                        { marginBottom: unread > 0 ? 4 : 0 },
                      ]}
                    >
                      {timeLabel}
                    </Text>
                    {unread > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{unread}</Text>
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
        style={[
          styles.messageContainer,
          { alignSelf: isMe ? 'flex-end' : 'flex-start' },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            { backgroundColor: isMe ? '#180fc4ff' : '#eeeeee' },
          ]}
        >
          <Text style={{ color: isMe ? 'white' : 'black' }}>{item.text}</Text>
          <Text
            style={[
              styles.messageTime,
              { color: isMe ? '#e0e0ff' : '#666' },
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderChatItem = ({ item }) =>
    item.type === 'date' ? (
      <View style={styles.dateHeaderContainer}>
        <Text style={styles.dateHeaderText}>{item.label}</Text>
      </View>
    ) : (
      renderMessageItem(item)
    );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.conversationContainer}>
        <Text style={styles.conversationTitle}>Chat with {otherLabel}</Text>

        <FlatList
          style={styles.flex}
          data={chatItems}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
        />

        <View style={styles.inputRow}>
          <TextInput
            mode="outlined"
            placeholder="Type a message..."
            value={text}
            onChangeText={setText}
            style={styles.input}
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

// Tyylit 

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // RecentChatsView
  recentContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  recentTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  recentEmpty: {
    alignItems: 'center',
    marginTop: 20,
  },
  recentEmptyText: {
    color: 'white',
  },
  recentListContent: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  recentItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 8,
  },
  recentItemTitle: {
    fontWeight: '600',
  },
  recentRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 4,
    marginTop: 4,
  },
  recentTime: {
    color: '#555',
  },
  unreadBadge: {
    backgroundColor: '#180fc4ff',
    borderRadius: 10,
    minWidth: 18,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
  },

  // ConversationView
  conversationContainer: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f7f7f7',
  },
  conversationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  messageContainer: {
    marginVertical: 4,
    marginHorizontal: 8,
    maxWidth: '80%',
  },
  messageBubble: {
    padding: 8,
    borderRadius: 10,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  dateHeaderText: {
    fontSize: 12,
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
});
