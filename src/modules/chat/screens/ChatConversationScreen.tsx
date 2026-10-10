import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick, types as documentTypes } from '@react-native-documents/picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useAppTheme } from '../../../theme/ThemeContext';
import {
  createChatPoll,
  fetchChatPresence,
  fetchMessages,
  markConversationRead,
  sendFileMessage,
  sendImageMessage,
  sendTextMessage,
  uploadChatDocument,
  uploadChatImage,
  updateConversationTheme,
  voteChatPoll,
} from '../api/chatApi';
import ChatAvatar from '../components/ChatAvatar';
import {
  chatError,
  chatImageUrl,
  chatTime,
  conversationTitle,
  otherMember,
} from '../utils';
import { chatSocket } from '../services/chatSocket';
import type { ChatMessage, ChatStackParamList, ChatThemeKey } from '../types';
import PollBubble from '../components/PollBubble';
import CreatePollModal from '../components/CreatePollModal';
import ChatAttachmentSheet from '../components/ChatAttachmentSheet';
import ChatSettingsSheet from '../components/ChatSettingsSheet';
import { getChatTheme } from '../theme/chatThemes';

type Route = NativeStackScreenProps<
  ChatStackParamList,
  'ChatConversation'
>['route'];
type Navigation = NativeStackNavigationProp<ChatStackParamList>;
const clientId = (id?: number) =>
  `${id || 'user'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function ChatConversationScreen() {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<Route>();
  const conversation = params.conversation;
  const { user, accessToken } = useAuth();
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [pollModal, setPollModal] = useState(false);
  const [attachmentMenu, setAttachmentMenu] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [chatThemeKey, setChatThemeKey] = useState<ChatThemeKey>(conversation.theme_key || 'default');
  const title = conversationTitle(conversation, user?.user_id);
  const peer = otherMember(conversation, user?.user_id);

  const markLatestRead = useCallback(
    (list: ChatMessage[]) => {
      const latest = [...list]
        .reverse()
        .find(item => Number(item.sender_id) !== Number(user?.user_id));
      if (latest)
        markConversationRead(
          conversation.conversation_id,
          latest.message_id,
        ).catch(() => {});
    },
    [conversation.conversation_id, user?.user_id],
  );

  useEffect(() => {
    let active = true;
    fetchMessages(conversation.conversation_id)
      .then(data => {
        if (active) {
          setMessages(data);
          markLatestRead(data);
        }
      })
      .catch(error =>
        Alert.alert(
          'Messages unavailable',
          chatError(error, 'Unable to load messages.'),
        ),
      )
      .finally(() => active && setLoading(false));
    if (peer?.user_id)
      fetchChatPresence([peer.user_id])
        .then(([presence]) => {
          if (active && presence) {
            setOnline(presence.online);
            setLastSeenAt(presence.last_seen_at || null);
          }
        })
        .catch(() => {});
    if (accessToken) chatSocket.connect(accessToken);
    const unsubscribe = chatSocket.subscribe(event => {
      if (event.type === 'connected' && peer?.user_id) {
        setOnline(
          (event.data?.online_user_ids || [])
            .map(Number)
            .includes(Number(peer.user_id)),
        );
        return;
      }
      if (
        Number(event.data?.conversation_id) !==
        Number(conversation.conversation_id)
      )
        return;
      if (event.type === 'message:new')
        setMessages(current => {
          if (current.some(item => item.message_id === event.data.message_id))
            return current;
          const next = [...current, event.data];
          markLatestRead(next);
          return next;
        });
      if (event.type === 'message:read')
        setMessages(current =>
          current.map(item =>
            Number(item.sender_id) === Number(user?.user_id) &&
            item.message_id <= Number(event.data?.message_id)
              ? { ...item, is_read: true }
              : item,
          ),
        );
      if (event.type === 'conversation:theme')
        setChatThemeKey(event.data.theme_key || 'default');
      if (event.type === 'poll:updated')
        setMessages(current =>
          current.map(item =>
            item.message_id === Number(event.data?.message_id)
              ? {
                  ...item,
                  poll: {
                    ...event.data.poll,
                    options: event.data.poll.options.map((option: any) => ({
                      ...option,
                      selected_by_me:
                        Number(event.data?.voter_id) ===
                          Number(user?.user_id) &&
                        event.data.option_ids
                          .map(Number)
                          .includes(Number(option.option_id)),
                    })),
                  },
                }
              : item,
          ),
        );
      if (
        (event.type === 'typing:start' || event.type === 'typing:stop') &&
        Number(event.data?.user_id) !== Number(user?.user_id)
      )
        setTyping(event.type === 'typing:start');
      if (
        event.type === 'presence' &&
        Number(event.data?.user_id) === Number(peer?.user_id)
      ) {
        setOnline(Boolean(event.data.online));
        if (event.data?.last_seen_at) setLastSeenAt(event.data.last_seen_at);
      }
    });
    return () => {
      active = false;
      unsubscribe();
      if (typingTimer.current) clearTimeout(typingTimer.current);
      chatSocket.send('typing:stop', conversation.conversation_id);
    };
  }, [
    accessToken,
    conversation.conversation_id,
    markLatestRead,
    peer?.user_id,
    user?.user_id,
  ]);

  const onChangeText = (value: string) => {
    setText(value);
    chatSocket.send('typing:start', conversation.conversation_id);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => chatSocket.send('typing:stop', conversation.conversation_id),
      1200,
    );
  };
  const addMessage = (message: ChatMessage) =>
    setMessages(current =>
      current.some(item => item.message_id === message.message_id)
        ? current
        : [...current, message],
    );
  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setText('');
    setSending(true);
    chatSocket.send('typing:stop', conversation.conversation_id);
    try {
      addMessage(
        await sendTextMessage(
          conversation.conversation_id,
          body,
          clientId(user?.user_id),
        ),
      );
    } catch (error) {
      setText(body);
      Alert.alert('Message not sent', chatError(error, 'Please try again.'));
    } finally {
      setSending(false);
    }
  };
  const pickAndSendImage = async () => {
    if (sending) return;
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.9,
    });
    const asset = result.assets?.[0];
    if (result.didCancel || !asset?.uri) return;
    setSending(true);
    try {
      const upload = await uploadChatImage({
        uri: asset.uri,
        type: asset.type,
        fileName: asset.fileName,
      });
      addMessage(
        await sendImageMessage(
          conversation.conversation_id,
          upload,
          clientId(user?.user_id),
        ),
      );
    } catch (error) {
      Alert.alert('Image not sent', chatError(error, 'Please try again.'));
    } finally {
      setSending(false);
    }
  };
  const pickAndSendDocument = async () => {
    if (sending) return;
    try {
      const [file] = await pick({
        type: [
          documentTypes.pdf,
          documentTypes.doc,
          documentTypes.docx,
          documentTypes.xls,
          documentTypes.xlsx,
          documentTypes.ppt,
          documentTypes.pptx,
          documentTypes.plainText,
          documentTypes.csv,
        ],
      });
      if (!file) return;
      setSending(true);
      const upload = await uploadChatDocument({
        uri: file.uri,
        type: file.type,
        name: file.name,
      });
      addMessage(
        await sendFileMessage(
          conversation.conversation_id,
          upload,
          clientId(user?.user_id),
        ),
      );
    } catch (error: any) {
      if (error?.code !== 'OPERATION_CANCELED')
        Alert.alert('Document not sent', chatError(error, 'Please try again.'));
    } finally {
      setSending(false);
    }
  };
  const showAttachmentMenu = () => setAttachmentMenu(true);
  const createPoll = async (question: string, options: string[]) => {
    addMessage(
      await createChatPoll(
        conversation.conversation_id,
        question,
        options,
        clientId(user?.user_id),
      ),
    );
  };
  const votePoll = async (
    messageId: number,
    pollId: number,
    optionId: number,
  ) => {
    const poll = await voteChatPoll(pollId, [optionId]);
    setMessages(current =>
      current.map(item =>
        item.message_id === messageId ? { ...item, poll } : item,
      ),
    );
  };
  const directStatus = online
    ? 'online'
    : lastSeenAt
    ? `last seen ${new Date(lastSeenAt).toLocaleString([], {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : 'last seen recently';

  const selectedTheme = getChatTheme(chatThemeKey);
  const changeTheme = async (nextTheme: ChatThemeKey) => {
    if (nextTheme === chatThemeKey || themeSaving) return;
    const previous = chatThemeKey;
    setChatThemeKey(nextTheme);
    setThemeSaving(true);
    try {
      await updateConversationTheme(conversation.conversation_id, nextTheme);
    } catch (error) {
      setChatThemeKey(previous);
      Alert.alert('Theme not changed', chatError(error, 'Please try again.'));
    } finally {
      setThemeSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: isDark ? selectedTheme.darkBackground : selectedTheme.lightBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 7,
            borderBottomColor: theme.border,
            backgroundColor: theme.card,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={25}
            color={theme.text}
          />
        </TouchableOpacity>
        <TouchableOpacity
          disabled={conversation.type === 'direct' && !peer}
          onPress={() =>
            conversation.type === 'group'
              ? navigation.navigate('GroupInfo', { conversation })
              : peer && navigation.navigate('MemberProfile', { member: peer })
          }
          activeOpacity={0.72}
          style={styles.headerDetails}
        >
          <ChatAvatar
            name={title}
            uri={conversation.type === 'direct' ? peer?.user_image : undefined}
            size={42}
            online={online}
          />
          <View style={styles.headerText}>
            <Text
              style={[styles.title, { color: theme.text }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <View style={styles.statusRow}>
              {online && !typing && conversation.type === 'direct' ? (
                <View style={styles.onlineDot} />
              ) : null}
              <Text
                style={[
                  styles.status,
                  { color: typing || online ? '#22C55E' : theme.secondaryText },
                ]}
                numberOfLines={1}
              >
                {typing
                  ? 'typing…'
                  : conversation.type === 'group'
                  ? `${conversation.members.length} members · tap for info`
                  : directStatus}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Chat settings" onPress={() => setSettingsVisible(true)} style={styles.settingsButton}>
          <MaterialCommunityIcons
            name="pencil-outline"
            size={21}
            color={theme.primary}
          />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item =>
            String(item.message_id || item.client_message_id)
          }
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          renderItem={({ item, index }) => {
            const mine = Number(item.sender_id) === Number(user?.user_id);
            const showName =
              conversation.type === 'group' &&
              !mine &&
              messages[index - 1]?.sender_id !== item.sender_id;
            const foreground = mine ? '#FFF' : theme.text;
            return (
              <View
                style={[
                  styles.messageRow,
                  mine ? styles.mineRow : styles.theirRow,
                ]}
              >
                <View
                  style={[
                    styles.bubbleWrap,
                    mine ? styles.mineWrap : styles.theirWrap,
                  ]}
                >
                  {showName ? (
                    <Text style={[styles.sender, { color: theme.primary }]}>
                      {item.sender_name}
                    </Text>
                  ) : null}
                  <View
                    style={[
                      styles.bubble,
                      item.message_type === 'image' && styles.imageBubble,
                      mine
                        ? [styles.mine, { backgroundColor: selectedTheme.accent }]
                        : { backgroundColor: isDark ? selectedTheme.darkOtherBubble : selectedTheme.lightOtherBubble },
                    ]}
                  >
                    {item.deleted_at ? (
                      <Text style={[styles.messageText, { color: foreground }]}>
                        This message was deleted
                      </Text>
                    ) : item.message_type === 'image' && item.attachment_url ? (
                      <Image
                        source={{ uri: chatImageUrl(item.attachment_url) }}
                        style={styles.chatImage}
                        resizeMode="cover"
                      />
                    ) : item.message_type === 'file' && item.attachment_url ? (
                      <TouchableOpacity
                        style={styles.fileRow}
                        onPress={() => Linking.openURL(item.attachment_url!)}
                      >
                        <MaterialCommunityIcons
                          name="file-document-outline"
                          size={30}
                          color={foreground}
                        />
                        <View style={styles.fileText}>
                          <Text
                            numberOfLines={2}
                            style={[styles.fileName, { color: foreground }]}
                          >
                            {item.attachment_name || 'Document'}
                          </Text>
                          <Text
                            style={[styles.fileType, { color: foreground }]}
                          >
                            {item.attachment_mime_type || 'File'}
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="download"
                          size={21}
                          color={foreground}
                        />
                      </TouchableOpacity>
                    ) : item.message_type === 'poll' && item.poll ? (
                      <PollBubble
                        poll={item.poll}
                        mine={mine}
                        textColor={foreground}
                        onVote={optionId =>
                          votePoll(
                            item.message_id,
                            item.poll!.poll_id,
                            optionId,
                          )
                        }
                      />
                    ) : (
                      <Text style={[styles.messageText, { color: foreground }]}>
                        {item.body}
                      </Text>
                    )}
                    <View style={styles.metaRow}>
                      <Text
                        style={[
                          styles.messageTime,
                          {
                            color: mine
                              ? 'rgba(255,255,255,.72)'
                              : theme.secondaryText,
                          },
                        ]}
                      >
                        {chatTime(item.created_at)}
                      </Text>
                      {mine ? (
                        <MaterialCommunityIcons
                          name={item.is_read ? 'check-all' : 'check'}
                          size={15}
                          color={
                            item.is_read ? '#67E8F9' : 'rgba(255,255,255,.72)'
                          }
                        />
                      ) : null}
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="hand-wave-outline"
                size={32}
                color={theme.primary}
              />
              <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                Say hello to start the conversation
              </Text>
            </View>
          }
        />
      )}
      <View
        style={[
          styles.composerWrap,
          {
            paddingBottom: Math.max(insets.bottom, 9),
            borderTopColor: theme.border,
            backgroundColor: theme.card,
          },
        ]}
      >
        <View
          style={[
            styles.composer,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Add attachment or poll"
            onPress={showAttachmentMenu}
            disabled={sending}
            style={[styles.attach, { backgroundColor: theme.primary }]}
          >
            <MaterialCommunityIcons name="paperclip" size={21} color="#FFF" />
          </TouchableOpacity>
          <TextInput
            value={text}
            onChangeText={onChangeText}
            onFocus={() =>
              setTimeout(
                () => listRef.current?.scrollToEnd({ animated: true }),
                250,
              )
            }
            placeholder="Message"
            placeholderTextColor={theme.secondaryText}
            style={[styles.input, { color: theme.text }]}
            multiline
            maxLength={5000}
          />
          <TouchableOpacity
            onPress={send}
            disabled={!text.trim() || sending}
            style={[
              styles.send,
              { backgroundColor: text.trim() ? theme.primary : theme.border },
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      <ChatSettingsSheet
        visible={settingsVisible}
        value={chatThemeKey}
        saving={themeSaving}
        onClose={() => setSettingsVisible(false)}
        onChange={changeTheme}
      />
      <ChatAttachmentSheet
        visible={attachmentMenu}
        onClose={() => setAttachmentMenu(false)}
        onImage={() => {
          setAttachmentMenu(false);
          void pickAndSendImage();
        }}
        onDocument={() => {
          setAttachmentMenu(false);
          void pickAndSendDocument();
        }}
        onPoll={() => {
          setAttachmentMenu(false);
          setPollModal(true);
        }}
      />
      <CreatePollModal
        visible={pollModal}
        onClose={() => setPollModal(false)}
        onCreate={createPoll}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    width: 40,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDetails: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerText: { flex: 1, marginLeft: 10 },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  title: { fontSize: 16, fontWeight: '800' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  status: { flexShrink: 1, fontSize: 11 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messages: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 13,
    paddingVertical: 16,
  },
  messageRow: { width: '100%', flexDirection: 'row' },
  mineRow: { justifyContent: 'flex-end' },
  theirRow: { justifyContent: 'flex-start' },
  bubbleWrap: { maxWidth: '84%', marginVertical: 3 },
  mineWrap: { alignItems: 'flex-end' },
  theirWrap: { alignItems: 'flex-start' },
  sender: { fontSize: 11, fontWeight: '700', marginLeft: 9, marginBottom: 2 },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingTop: 9,
    paddingBottom: 6,
  },
  imageBubble: { padding: 4 },
  chatImage: {
    width: 220,
    height: 220,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },
  fileRow: {
    width: 245,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 8,
  },
  fileText: { flex: 1 },
  fileName: { fontSize: 13, fontWeight: '800' },
  fileType: { fontSize: 9, opacity: 0.7, marginTop: 3 },
  mine: { backgroundColor: '#7C3AED', borderBottomRightRadius: 5 },
  messageText: { fontSize: 15, lineHeight: 20 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    paddingHorizontal: 5,
  },
  messageTime: { fontSize: 9, marginTop: 3 },
  empty: { alignItems: 'center', paddingBottom: 120 },
  emptyText: { marginTop: 10 },
  composerWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  composer: {
    minHeight: 52,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  attach: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  input: { flex: 1, maxHeight: 105, paddingVertical: 8, fontSize: 15 },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
