// @refresh reset
import { getChatUserId, sameChatId } from "../identity";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  BackHandler,
  Clipboard,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { launchImageLibrary, type Asset } from "react-native-image-picker";
import {
  pick,
  keepLocalCopy,
  types as documentTypes,
} from "@react-native-documents/picker";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../common/auth/context/AuthContext";
import {
  createChatPoll,
  deleteChatMessage,
  fetchChatPresence,
  fetchConversations,
  fetchMessages,
  markConversationRead,
  sendFileMessage,
  sendImageMessage,
  sendTextMessage,
  uploadChatDocument,
  uploadChatImage,
  updateConversationTheme,
  voteChatPoll,
  type UploadedChatImage,
} from "../api/chatApi";
import ChatAvatar from "../components/ChatAvatar";
import ChatMessageActionSheet, {
  type MessageAction,
} from "../components/ChatMessageActionSheet";
import ChatMessageBubble from "../components/ChatMessageBubble";
import CreatePollModal from "../components/CreatePollModal";
import ChatAttachmentSheet from "../components/ChatAttachmentSheet";
import ChatSettingsSheet from "../components/ChatSettingsSheet";
import ChatEmojiPanel from "../components/ChatEmojiPanel";
import { useChatColors } from "../components/chatUiTokens";
import {
  chatError,
  conversationTitle,
  otherMember,
  previousGraphemeStart,
  safeChatAttachmentUrl,
} from "../utils";
import {
  deletedMessage,
  mergeMessages,
  mergePollUpdate,
  messagePreview,
} from "../messageState";
import { chatSocket } from "../services/chatSocket";
import { notifyChatReadConfirmed } from "../chatUnreadEvents";
import { getChatTheme } from "../theme/chatThemes";
import type { ChatMessage, ChatStackParamList, ChatThemeKey } from "../types";
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";
import { formatDateTime } from "../../../i18n/format";

type Route = NativeStackScreenProps<
  ChatStackParamList,
  "ChatConversation"
>["route"];
type Navigation = NativeStackNavigationProp<ChatStackParamList>;
const clientId = (id?: number) =>
  `${id || "user"}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function ChatConversationScreen() {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<Route>();
  const { user } = useAuth();
  const currentUserId = getChatUserId(user);
  const theme = useChatColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [conversation, setConversation] = useState(params.conversation);
  const id = conversation.conversation_id;
  const peer = otherMember(conversation, currentUserId);
  const title = conversationTitle(conversation, currentUserId);
  const [messageActions, setMessageActions] = useState<MessageAction[] | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef(messages);
  const tombstones = useRef(new Map<number, string>());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [olderLoading, setOlderLoading] = useState(false);
  const hasOlder = useRef(true);
  const historyBusy = useRef(false);
  const loadedPages = useRef(new Set<number>());
  const syncing = useRef(false);
  const lastSyncAt = useRef(0);
  const needsSync = useRef(false);
  const focused = useRef(false);
  const mounted = useRef(true);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  // Offset 0 is the newest message in the inverted list.
  const atLatest = useRef(true);
  const newestKey = useRef<string | null>(null);
  const [unseen, setUnseen] = useState(0);
  const quoteJump = useRef({ index: -1, attempts: 0 });
  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState("");
  const textRef = useRef("");
  const selection = useRef({ start: 0, end: 0 });
  const [reply, setReply] = useState<ChatMessage | null>(null);
  const replyRef = useRef(reply);
  replyRef.current = reply;
  const [sending, setSending] = useState(false);
  const sendBusy = useRef(false);
  const optimisticId = useRef(-1);
  const [online, setOnline] = useState(false);
  const [presenceKnown, setPresenceKnown] = useState(false);
  const presenceRevision = useRef(0);
  const [socketConnected, setSocketConnected] = useState(chatSocket.isConnected());
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [typers, setTypers] = useState<number[]>([]);
  const typingExpiry = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTyping = useRef(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeKey, setThemeKey] = useState<ChatThemeKey>(
    conversation.theme_key || "default"
  );
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeUnavailable, setThemeUnavailable] = useState<string | null>(null);
  const themeBusy = useRef(false);
  const themeRevision = useRef(0);
  const [media, setMedia] = useState<{ uri: string; asset?: Asset } | null>(
    null
  );
  const photoDraft = useRef<{
    uri: string;
    key: string;
    upload?: UploadedChatImage;
  } | null>(null);
  const pollDraft = useRef<{ fingerprint: string; key: string } | null>(null);
  const selectedTheme = getChatTheme(themeKey);
  useEffect(() => {
    if (__DEV__)
      console.debug("[CHAT DEBUG]", {
        currentUserId,
        conversationId: id,
        identityAvailable: currentUserId !== undefined,
      });
  }, [currentUserId, id]);
  const readThrough = useRef(0);
  const newestFirst = useMemo(() => [...messages].reverse(), [messages]);
  const messageMap = useMemo(
    () => new Map(messages.map((message) => [message.message_id, message])),
    [messages]
  );

  useEffect(() => {
    mounted.current = true;
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardOpen(true)
    );
    const appState = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        chatSocket.send("typing:stop", id);
        if (typingTimer.current) clearTimeout(typingTimer.current);
      }
    });
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardOpen(false)
    );
    return () => {
      mounted.current = false;
      if (quoteTimer.current) clearTimeout(quoteTimer.current);
      appState.remove();
      show.remove();
      hide.remove();
    };
  }, []);
  const merge = useCallback((incoming: ChatMessage[]) => {
    if (!mounted.current) return;
    setMessages((current) => {
      const next = mergeMessages(
        current,
        incoming.map((message) =>
          tombstones.current.has(Number(message.message_id))
            ? deletedMessage(
                message,
                tombstones.current.get(Number(message.message_id))!
              )
            : message
        )
      );
      messagesRef.current = next;
      return next;
    });
  }, []);
  const markRead = useCallback(
    (list: ChatMessage[]) => {
      if (
        !focused.current ||
        AppState.currentState === "background" ||
        AppState.currentState === "inactive"
      )
        return;
      const latest = [...list]
        .reverse()
        .find(
          (item) =>
            item.message_id > 0 && !sameChatId(item.sender_id, currentUserId)
        );
      if (!latest || latest.message_id <= readThrough.current) return;
      const previous = readThrough.current;
      readThrough.current = latest.message_id;
      markConversationRead(id, latest.message_id)
        .then(() => notifyChatReadConfirmed(Number(id)))
        .catch(() => {
          if (readThrough.current === latest.message_id)
            readThrough.current = previous;
        });
    },
    [id, currentUserId]
  );

  // Presence must NOT depend on message fetch success, otherwise a message
  // endpoint error wrongly makes an online user appear offline.
  const refreshPresence = useCallback(async () => {
    if (!peer?.user_id || !focused.current) return;
    const version = presenceRevision.current;
    try {
      const result = await fetchChatPresence([peer.user_id]);
      if (!focused.current || !mounted.current || version !== presenceRevision.current) return;
      const state = result.find(item => sameChatId(item.user_id, peer.user_id));
      if (state) {
        setOnline(Boolean(state.online));
        setPresenceKnown(true);
        setLastSeen(state.last_seen_at || null);
      }
    } catch {
      // Retain last known state during temporary REST errors.
    }
  }, [peer?.user_id]);

  const sync = useCallback(async () => {
    if (!focused.current) return;
    if (syncing.current) { needsSync.current = true; return; }
    syncing.current = true;
    try {
      let page = await fetchMessages(id);
      const all = [...page];
      // Walk the gap after a long disconnect instead of dropping all but 40 messages.
      const confirmed = messagesRef.current.filter(
        (item) => item.message_id > 0
      );
      const boundary = confirmed.length
        ? Math.max(...confirmed.map((item) => item.message_id))
        : null;
      let before = page.length
        ? Math.min(...page.map((item) => item.message_id))
        : 0;
      while (
        focused.current &&
        boundary !== null &&
        page.length === 40 &&
        before > boundary
      ) {
        page = await fetchMessages(id, before);
        all.push(...page);
        const next = page.length
          ? Math.min(...page.map((item) => item.message_id))
          : 0;
        if (!next || next >= before) break;
        before = next;
      }
      if (!focused.current) return;
      if (!confirmed.length) hasOlder.current = page.length === 40;
      merge(all);
      markRead(all.sort((a, b) => a.message_id - b.message_id));
      lastSyncAt.current = Date.now();
      setLoadError("");
    } catch (error) {
      if (focused.current)
        setLoadError(
          chatError(error, i18n.t("chat:conv.loadError"))
        );
    } finally {
      syncing.current = false;
      if (mounted.current) setLoading(false);
      if (focused.current && needsSync.current) {
        needsSync.current = false;
        void sync();
      }
    }
  }, [id, merge, markRead]);

  const refreshConversation = useCallback(async (isActive: () => boolean) => {
    const revision = themeRevision.current;
    const savingTheme = themeBusy.current;
    try {
      const items = await fetchConversations();
      const updated = items.find((item) => sameChatId(item.conversation_id, id));
      if (!isActive() || !updated) return;
      setConversation(updated);
      if (!savingTheme && !themeBusy.current && themeRevision.current === revision)
        setThemeKey(getChatTheme(updated.theme_key).key);
    } catch {
      // Keep the last known settings when the refresh is unavailable.
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      let active = true;
      const refreshSettings = () => refreshConversation(() => active);
      // Subscribe first so the socket's onopen/resync event isn't missed.
      const unsubscribe = chatSocket.subscribe((event) => {
        if (!focused.current) return;
        const envelope = (event.data || {}) as Record<string, any>;
        // Support both {type, data: message} and {type, data: {message}}.
        const data = event.type === "message:new" && envelope.message &&
          typeof envelope.message === "object"
          ? { ...envelope.message,
              conversation_id: envelope.message.conversation_id ?? envelope.conversation_id }
          : envelope;
        if (String(event.type) === "connection:state") {
          const ready = envelope.status === "connected";
          setSocketConnected(ready);
          if (!ready) {
            typingExpiry.current.forEach(clearTimeout);
            typingExpiry.current.clear();
            setTypers([]);
          }
          return;
        }
        if (event.type === "resync") {
          void sync();
          void refreshPresence();
          void refreshSettings();
          return;
        }
        if (
          event.type === "presence" &&
          sameChatId(data.user_id, peer?.user_id)
        ) {
          presenceRevision.current++;
          setOnline(Boolean(data.online));
          setPresenceKnown(true);
          setLastSeen(data.last_seen_at || null);
          return;
        }
        if (
          event.type === "connected" &&
          peer?.user_id &&
          Array.isArray(data.online_user_ids)
        ) {
          presenceRevision.current++;
          setOnline(
            data.online_user_ids.map(Number).includes(Number(peer.user_id))
          );
          setPresenceKnown(true);
          return;
        }
        // The verified poll broadcast omits conversation_id; scope it by loaded message.
        const loadedPoll = event.type === "poll:updated" && messagesRef.current.some(message => sameChatId(message.message_id, data.message_id));
        if (!sameChatId(data.conversation_id, id) && !loadedPoll) return;
        if (event.type === "message:new") {
          if (data.message_id && data.sender_id) {
            merge([data as ChatMessage]);
            markRead([data as ChatMessage]);
          } else {
            // A partial event should trigger REST recovery, not a malformed bubble.
            void sync();
          }
        }
        if (event.type === "message:deleted") {
          const messageId = Number(data.message_id);
          const date = data.deleted_at || new Date().toISOString();
          tombstones.current.set(messageId, date);
          setMessages((current) => {
            const next = current.map((item) =>
              item.message_id === messageId ? deletedMessage(item, date) : item
            );
            messagesRef.current = next;
            return next;
          });
          if (replyRef.current?.message_id === messageId) setReply(null);
        }
        if (
          event.type === "message:read" &&
          !sameChatId(data.user_id, currentUserId)
        ) {
          setMessages((current) => {
            const next = current.map((item) =>
              item.message_id > 0 &&
              item.message_id <= Number(data.message_id) &&
              sameChatId(item.sender_id, currentUserId)
                ? { ...item, is_read: true }
                : item
            );
            messagesRef.current = next;
            return next;
          });
        }
        if (event.type === "conversation:updated")
          setConversation((current) => ({ ...current, ...data }));
        if (event.type === "conversation:theme") {
          themeRevision.current++;
          setThemeUnavailable(null);
          setThemeKey(getChatTheme(data.theme_key).key);
        }
        if (event.type === "poll:updated" && data.poll?.options) {
          setMessages((current) => {
            const next = current.map((item) =>
              !item.deleted_at &&
              item.poll &&
              (item.message_id === Number(data.message_id) ||
                Number(item.poll.poll_id) === Number(data.poll.poll_id))
                ? {
                    ...item,
                    poll: mergePollUpdate(
                      item.poll,
                      data.poll,
                      Number(data.voter_id),
                      currentUserId,
                      data.option_ids
                    ),
                  }
                : item
            );
            messagesRef.current = next;
            return next;
          });
        }
        if (
          (event.type === "typing:start" || event.type === "typing:stop") &&
          !sameChatId(data.user_id, currentUserId)
        ) {
          const typer = Number(data.user_id);
          if (!Number.isFinite(typer)) return;
          const timer = typingExpiry.current.get(typer);
          if (timer) clearTimeout(timer);
          setTypers((current) =>
            event.type === "typing:stop"
              ? current.filter((value) => value !== typer)
              : [...new Set([...current, typer])]
          );
          if (event.type === "typing:start")
            typingExpiry.current.set(
              typer,
              setTimeout(
                () =>
                  setTypers((current) =>
                    current.filter((value) => value !== typer)
                  ),
                6000
              )
            );
        }
      });
      // Existing sessions may have connected before this screen was mounted.
      // Calling ensureConnected is idempotent for the shared singleton.
      chatSocket.ensureConnected();
      void sync();
      void refreshPresence();
      void refreshSettings();
      const appState = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          chatSocket.ensureConnected();
          void sync();
          void refreshPresence();
          void refreshSettings();
        }
      });
      // Safety-net reconciliation even when the TCP connection looks OPEN but
      // server fan-out missed an event. WebSocket still handles instant updates.
      // Live sockets only need an occasional check; a dropped one keeps the 12s cadence.
      const poll = setInterval(() => {
        if (AppState.currentState !== "background" && AppState.currentState !== "inactive") {
          chatSocket.ensureConnected();
          if (!chatSocket.isConnected() || Date.now() - lastSyncAt.current >= 30000)
            void sync();
        }
      }, 12000);
      const presencePoll = setInterval(() => {
        if (AppState.currentState !== "background" && AppState.currentState !== "inactive")
          void refreshPresence();
      }, 15000);
      return () => {
        active = false;
        focused.current = false;
        needsSync.current = false;
        appState.remove();
        clearInterval(poll);
        clearInterval(presencePoll);
        unsubscribe();
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingExpiry.current.forEach(clearTimeout);
        typingExpiry.current.clear();
        if (mounted.current) setTypers([]);
        chatSocket.send("typing:stop", id);
        Keyboard.dismiss();
      };
    }, [sync, refreshPresence, refreshConversation, id, peer?.user_id, currentUserId, merge, markRead])
  );

  const loadOlder = useCallback(async () => {
    if (historyBusy.current || !hasOlder.current || loading) return;
    const confirmed = messagesRef.current.filter((item) => item.message_id > 0);
    const before = confirmed.length
      ? Math.min(...confirmed.map((item) => item.message_id))
      : 0;
    if (!before || loadedPages.current.has(before)) return;
    historyBusy.current = true;
    setOlderLoading(true);
    try {
      const page = await fetchMessages(id, before);
      if (!mounted.current) return;
      loadedPages.current.add(before);
      hasOlder.current =
        page.length === 40 && page.some((item) => item.message_id < before);
      merge(page);
    } catch (error) {
      if (mounted.current)
        Alert.alert(
          i18n.t("chat:conv.historyUnavailable"),
          chatError(error, i18n.t("chat:conv.scrollToRetry"))
        );
    } finally {
      historyBusy.current = false;
      if (mounted.current) setOlderLoading(false);
    }
  }, [id, loading, merge]);
  const changeText = (value: string) => {
    textRef.current = value;
    setText(value);
    if (value.trim() && Date.now() - lastTyping.current > 2500) {
      if (chatSocket.send("typing:start", id)) lastTyping.current = Date.now();
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (!value.trim()) {
      chatSocket.send("typing:stop", id);
      lastTyping.current = 0;
    } else {
      typingTimer.current = setTimeout(() => {
        chatSocket.send("typing:stop", id);
        lastTyping.current = 0;
      }, 2000);
    }
  };
  const replaceSelection = (insert: string, backspace = false) => {
    const current = textRef.current;
    let start = Math.min(selection.current.start, current.length);
    const end = Math.min(
      Math.max(selection.current.end, start),
      current.length
    );
    if (backspace && start === end)
      start = previousGraphemeStart(current, start);
    const next = current.slice(0, start) + insert + current.slice(end);
    if (next.length > 5000) return;
    const cursor = { start: start + insert.length, end: start + insert.length };
    selection.current = cursor;
    changeText(next);
    // Update native cursor only after text changes; avoid a controlled selection during recycling.
    requestAnimationFrame(() => {
      if (mounted.current && focused.current && textRef.current === next) {
        selection.current = cursor;
        inputRef.current?.setNativeProps({ selection: cursor });
      }
    });
  };
  const toggleEmoji = () => {
    if (emojiOpen) {
      setEmojiOpen(false);
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
      Keyboard.dismiss();
      setEmojiOpen(true);
    }
  };
  useEffect(() => {
    if (!emojiOpen) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setEmojiOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [emojiOpen]);
  const scrollLatest = useCallback(() => {
    atLatest.current = true;
    setUnseen(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);
  // Keep the newest message visible above the composer, or count it as unseen
  // while the user is reading history.
  useEffect(() => {
    const newest = newestFirst[0];
    const key = newest
      ? newest.client_message_id || String(newest.message_id)
      : null;
    const previous = newestKey.current;
    newestKey.current = key;
    if (loading || !newest || previous === null || key === previous) return;
    if (atLatest.current || sameChatId(newest.sender_id, currentUserId)) {
      requestAnimationFrame(() => {
        if (mounted.current) scrollLatest();
      });
    } else {
      setUnseen((count) => count + 1);
    }
  }, [newestFirst, loading, currentUserId, scrollLatest]);
  const sendText = useCallback(
    async (message: ChatMessage) => {
      if (sendBusy.current || !message.body) return;
      sendBusy.current = true;
      setSending(true);
      merge([{ ...message, local_status: "sending" }]);
      try {
        merge([
          {
            ...(await sendTextMessage(
              id,
              message.body,
              message.client_message_id!,
              message.reply_to_message_id || undefined
            )),
            client_message_id: message.client_message_id,
          },
        ]);
      } catch (error) {
        // A socket acknowledgement may have arrived even if the HTTP request timed out.
        if (
          !messagesRef.current.some(
            (item) =>
              item.message_id > 0 &&
              item.client_message_id === message.client_message_id
          )
        )
          merge([{ ...message, local_status: "failed" }]);
        if (mounted.current)
          Alert.alert(
            i18n.t("chat:conv.notSent"),
            chatError(error, i18n.t("chat:conv.tapRetry"))
          );
      } finally {
        sendBusy.current = false;
        if (mounted.current) setSending(false);
      }
    },
    [id, merge]
  );
  const send = () => {
    const body = textRef.current.trim();
    if (!body || sendBusy.current) return;
    if (currentUserId === undefined) {
      Alert.alert(
        i18n.t("chat:conv.accountUnavailable"),
        i18n.t("chat:conv.identityFailed")
      );
      return;
    }
    const message: ChatMessage = {
      message_id: optimisticId.current--,
      conversation_id: id,
      sender_id: Number(currentUserId),
      sender_name: user?.name || i18n.t("chat:conv.you"),
      client_message_id: clientId(currentUserId),
      message_type: "text",
      body,
      created_at: new Date().toISOString(),
      reply_to_message_id: reply?.message_id || undefined,
      local_status: "sending",
    };
    changeText("");
    selection.current = { start: 0, end: 0 };
    setReply(null);
    void sendText(message);
    scrollLatest();
  };
  const selectReply = useCallback((message: ChatMessage) => {
    if (message.deleted_at || message.message_id <= 0) return;
    setReply(message);
    setEmojiOpen(false);
    inputRef.current?.focus();
  }, []);
  const confirmDelete = useCallback(
    (message: ChatMessage) => {
      Alert.alert(
        i18n.t("chat:conv.deleteTitle"),
        i18n.t("chat:conv.deleteBody"),
        [
          { text: i18n.t("common:actions.cancel"), style: "cancel" },
          {
            text: i18n.t("common:actions.delete"),
            style: "destructive",
            onPress: async () => {
              try {
                const result = await deleteChatMessage(id, message.message_id);
                const date = result.deleted_at || new Date().toISOString();
                tombstones.current.set(message.message_id, date);
                merge([deletedMessage(message, date)]);
                if (replyRef.current?.message_id === message.message_id)
                  setReply(null);
              } catch (error) {
                if (mounted.current)
                  Alert.alert(
                    i18n.t("chat:conv.notDeleted"),
                    chatError(error, i18n.t("common:errors.generic"))
                  );
              }
            },
          },
        ]
      );
    },
    [id, merge]
  );
  const actions = useCallback(
    (message: ChatMessage) => {
      if (message.deleted_at) return;
      const options: Array<{
        text: string;
        onPress: () => void;
        style?: "destructive";
      }> = [];
      if (message.message_id > 0)
        options.push({ text: i18n.t("common:actions.reply"), onPress: () => selectReply(message) });
      if (message.body)
        options.push({
          text: i18n.t("chat:conv.copyText"),
          onPress: () => Clipboard.setString(message.body!),
        });
      if (
        message.message_id > 0 &&
        sameChatId(message.sender_id, currentUserId)
      )
        options.push({
          text: i18n.t("common:actions.delete"),
          style: "destructive",
          onPress: () => confirmDelete(message),
        });
      if (message.local_status === "failed")
        options.push({
          text: i18n.t("common:actions.retry"),
          onPress: () => {
            void sendText(message);
          },
        });
      Keyboard.dismiss();
      setMessageActions(options);
    },
    [currentUserId, selectReply, confirmDelete, sendText]
  );
  const openFile = useCallback(async (message: ChatMessage) => {
    try {
      const url = safeChatAttachmentUrl(message.attachment_url);
      if (!url) throw new Error(i18n.t("chat:conv.invalidAttachment"));
      await Linking.openURL(url);
    } catch (error) {
      if (mounted.current)
        Alert.alert(
          i18n.t("chat:conv.openDocFailed"),
          chatError(error, i18n.t("chat:conv.noCompatibleApp"))
        );
    }
  }, []);
  const openImage = useCallback((message: ChatMessage) => {
    const uri = safeChatAttachmentUrl(message.attachment_url);
    if (uri) {
      Keyboard.dismiss();
      setMedia({ uri });
    }
  }, []);
  const jumpQuote = useCallback((message: ChatMessage) => {
    const index = [...messagesRef.current]
      .reverse()
      .findIndex((item) => item.message_id === message.message_id);
    if (index >= 0) {
      quoteJump.current = { index, attempts: 0 };
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, []);
  const retry = useCallback(
    (message: ChatMessage) => {
      void sendText(message);
    },
    [sendText]
  );
  const vote = useCallback(
    async (message: ChatMessage, optionId: number) => {
      if (!message.poll) return;
      const selected = message.poll.options
        .filter((option) => option.selected_by_me)
        .map((option) => option.option_id);
      const choices = message.poll.allow_multiple
        ? selected.includes(optionId)
          ? selected.filter((value) => value !== optionId)
          : [...selected, optionId]
        : [optionId];
      const poll = await voteChatPoll(message.poll.poll_id, choices);
      const current = messagesRef.current.find(
        (item) => item.message_id === message.message_id
      );
      if (current && !current.deleted_at) merge([{ ...current, poll }]);
    },
    [merge]
  );
  const pickImage = async () => {
    if (sendBusy.current) return;
    sendBusy.current = true;
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        selectionLimit: 1,
        quality: 0.9,
      });
      if (result.didCancel) return;
      if (result.errorCode)
        throw new Error(result.errorMessage || i18n.t("chat:conv.libraryUnavailable"));
      const asset = result.assets?.[0];
      if (mounted.current && asset?.uri) {
        photoDraft.current = { uri: asset.uri, key: clientId(currentUserId) };
        setMedia({ uri: asset.uri, asset });
      }
    } catch (error) {
      if (mounted.current)
        Alert.alert(i18n.t("chat:conv.photoUnavailable"), chatError(error, i18n.t("common:errors.generic")));
    } finally {
      sendBusy.current = false;
    }
  };
  const sendImage = async () => {
    if (!media?.asset?.uri || sendBusy.current) return;
    sendBusy.current = true;
    setSending(true);
    if (!photoDraft.current || photoDraft.current.uri !== media.uri)
      photoDraft.current = { uri: media.uri, key: clientId(currentUserId) };
    const draft = photoDraft.current;
    try {
      if (!draft.upload)
        draft.upload = await uploadChatImage({
          uri: media.asset.uri,
          type: media.asset.type,
          fileName: media.asset.fileName,
        });
      merge([
        {
          ...(await sendImageMessage(id, draft.upload, draft.key)),
          client_message_id: draft.key,
        },
      ]);
      if (mounted.current) setMedia(null);
      scrollLatest();
    } catch (error) {
      if (mounted.current)
        Alert.alert(i18n.t("chat:conv.photoNotSent"), chatError(error, i18n.t("common:errors.generic")));
    } finally {
      sendBusy.current = false;
      if (mounted.current) setSending(false);
    }
  };
  const pickDocument = async () => {
    if (sendBusy.current) return;
    sendBusy.current = true;
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
      const [copy] = await keepLocalCopy({
        files: [
          { uri: file.uri, fileName: file.name || `document-${Date.now()}` },
        ],
        destination: "cachesDirectory",
      });
      if (copy.status !== "success")
        throw new Error(
          i18n.t("chat:conv.fileNotAccessible")
        );
      if (!mounted.current) return;
      setSending(true);
      const upload = await uploadChatDocument({
        uri: copy.localUri,
        type: file.type,
        name: file.name,
      });
      merge([await sendFileMessage(id, upload, clientId(currentUserId))]);
      scrollLatest();
    } catch (error: any) {
      if (mounted.current && error?.code !== "OPERATION_CANCELED")
        Alert.alert(i18n.t("chat:conv.docNotSent"), chatError(error, i18n.t("common:errors.generic")));
    } finally {
      sendBusy.current = false;
      if (mounted.current) setSending(false);
    }
  };
  const createPoll = async (question: string, options: string[]) => {
    const fingerprint = JSON.stringify([question, options]);
    if (pollDraft.current?.fingerprint !== fingerprint)
      pollDraft.current = { fingerprint, key: clientId(currentUserId) };
    const key = pollDraft.current!.key;
    merge([
      {
        ...(await createChatPoll(id, question, options, key)),
        client_message_id: key,
      },
    ]);
    pollDraft.current = null;
    scrollLatest();
  };
  const changeTheme = async (next: ChatThemeKey) => {
    if (themeBusy.current || themeUnavailable || next === themeKey) return;
    const previous = themeKey;
    const revision = ++themeRevision.current;
    themeBusy.current = true;
    setThemeSaving(true);
    setThemeKey(next);
    try {
      await updateConversationTheme(id, next);
    } catch (error) {
      if (mounted.current) {
        if (themeRevision.current === revision) setThemeKey(previous);
        if ((error as any)?.code === "CHAT_THEME_UNAVAILABLE") setThemeUnavailable((error as Error).message);
        else Alert.alert(i18n.t("chat:conv.themeNotChanged"), chatError(error, i18n.t("common:errors.generic")));
      }
    } finally {
      themeBusy.current = false;
      if (mounted.current) setThemeSaving(false);
    }
  };
  const status = typers.length
    ? t("chat:conv.typing")
    : conversation.type === "group"
    ? t("chat:conv.members", { count: conversation.members.length })
    : !presenceKnown
    ? socketConnected ? t("chat:conv.checkingStatus") : t("chat:conv.connecting")
    : online
    ? t("chat:conv.online")
    : lastSeen && Number.isFinite(new Date(lastSeen).getTime())
    ? t("chat:conv.lastSeen", {
        time: formatDateTime(lastSeen, { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }),
      })
    : t("chat:conv.offline");

  return (
    <KeyboardAvoidingView
      style={[
        styles.screen,
        {
          paddingLeft: insets.left,
          paddingRight: insets.right,
          backgroundColor: theme.isDark
            ? selectedTheme.darkBackground
            : selectedTheme.lightBackground,
        },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.card,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("chat:conv.backToChats")}
          onPress={() => navigation.goBack()}
          style={styles.icon}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={30}
            color={theme.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={
            conversation.type === "group"
              ? t("chat:conv.viewGroupInfo")
              : t("chat:conv.viewMemberProfile")
          }
          disabled={conversation.type === "direct" && !peer}
          onPress={() =>
            conversation.type === "group"
              ? navigation.navigate("GroupInfo", { conversation })
              : peer && navigation.navigate("MemberProfile", { member: peer })
          }
          style={styles.headerDetails}
        >
          <ChatAvatar
            name={title}
            uri={
              conversation.type === "group"
                ? conversation.image_url
                : peer?.user_image
            }
            size={42}
            online={conversation.type === "direct" && online}
          />
          <View style={styles.headerText}>
            <Text
              numberOfLines={1}
              style={[styles.title, { color: theme.text }]}
            >
              {title}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.status,
                {
                  color:
                    typers.length || (conversation.type === "direct" && online)
                      ? "#22C55E"
                      : theme.secondaryText,
                },
              ]}
            >
              {status}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("chat:appearance.title")}
          onPress={() => {
            Keyboard.dismiss();
            setSettingsOpen(true);
          }}
          style={styles.icon}
        >
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={25}
            color={theme.text}
          />
        </TouchableOpacity>
      </View>
      {loadError && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => void sync()}
          style={[styles.error, { backgroundColor: theme.card }]}
        >
          <Text style={{ color: theme.secondaryText }}>
            {loadError} Tap to retry.
          </Text>
        </TouchableOpacity>
      )}
      <View style={styles.listArea}>
      {loading && !messages.length ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={newestFirst}
          inverted
          keyExtractor={(item) =>
            item.client_message_id || String(item.message_id)
          }
          initialNumToRender={20}
          maxToRenderPerBatch={12}
          windowSize={9}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 80,
          }}
          scrollEventThrottle={32}
          onScroll={({ nativeEvent }) => {
            atLatest.current = nativeEvent.contentOffset.y < 80;
            if (atLatest.current && unseen) setUnseen(0);
          }}
          onEndReached={() => void loadOlder()}
          onEndReachedThreshold={0.2}
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            listRef.current?.scrollToOffset({
              offset: index * averageItemLength,
              animated: false,
            });
            if (quoteJump.current.attempts >= 2) return;
            quoteJump.current.attempts++;
            if (quoteTimer.current) clearTimeout(quoteTimer.current);
            quoteTimer.current = setTimeout(() => {
              if (mounted.current && focused.current)
                listRef.current?.scrollToIndex({
                  index,
                  animated: true,
                  viewPosition: 0.5,
                });
            }, 250);
          }}
          renderItem={({ item, index }) => (
            <ChatMessageBubble
              message={item}
              quoted={
                item.reply_to_message_id
                  ? messageMap.get(item.reply_to_message_id)
                  : undefined
              }
              mine={sameChatId(item.sender_id, currentUserId)}
              group={conversation.type === "group"}
              showName={
                conversation.type === "group" &&
                !sameChatId(item.sender_id, currentUserId) &&
                !sameChatId(newestFirst[index + 1]?.sender_id, item.sender_id)
              }
              showAvatar={
                !sameChatId(newestFirst[index - 1]?.sender_id, item.sender_id)
              }
              preset={selectedTheme}
              onReply={selectReply}
              onActions={actions}
              onImage={openImage}
              onFile={openFile}
              onQuote={jumpQuote}
              onRetry={retry}
              onVote={vote}
            />
          )}
          ListFooterComponent={
            olderLoading ? (
              <ActivityIndicator
                style={{ padding: 16 }}
                color={theme.primary}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="message-text-outline"
                size={36}
                color={theme.primary}
              />
              <Text style={{ color: theme.secondaryText, marginTop: 12 }}>
                {i18n.t("chat:r2.sayHelloToStartTheConversation")}
              </Text>
            </View>
          }
        />
      )}
      {unseen > 0 && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("chat:conv.showNewMessages", { count: unseen })}
          onPress={scrollLatest}
          style={[styles.newMessages, { backgroundColor: selectedTheme.accent }]}
        >
          <MaterialCommunityIcons name="arrow-down" size={16} color="#FFF" />
          <Text style={styles.newMessagesText}>
            {t("chat:conv.newMessages", { count: unseen })}
          </Text>
        </TouchableOpacity>
      )}
      </View>
      <View
        style={[
          styles.composerWrap,
          {
            backgroundColor: theme.card,
            paddingBottom:
              keyboardOpen && !emojiOpen ? 8 : Math.max(insets.bottom, 8),
          },
        ]}
      >
        {reply && (
          <View
            style={[
              styles.reply,
              {
                backgroundColor: theme.background,
                borderLeftColor: theme.primary,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {reply.sender_name}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  color: theme.secondaryText,
                  fontSize: 13,
                  marginTop: 3,
                }}
              >
                {messagePreview(reply)}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t("chat:conv.cancelReply")}
              onPress={() => setReply(null)}
              style={styles.icon}
            >
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={theme.secondaryText}
              />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.composerRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("chat:conv.shareAttachment")}
            disabled={sending}
            onPress={() => {
              Keyboard.dismiss();
              setEmojiOpen(false);
              setAttachmentOpen(true);
            }}
            style={styles.icon}
          >
            <MaterialCommunityIcons
              name="plus"
              size={26}
              color={theme.primary}
            />
          </TouchableOpacity>
          <View
            style={[
              styles.inputPill,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={emojiOpen ? t("chat:conv.showKeyboard") : t("chat:conv.showEmojis")}
              onPress={toggleEmoji}
              style={styles.icon}
            >
              <MaterialCommunityIcons
                name={emojiOpen ? "keyboard-outline" : "emoticon-happy-outline"}
                size={23}
                color={theme.secondaryText}
              />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={changeText}
              onSelectionChange={(event) => {
                selection.current = event.nativeEvent.selection;
              }}
              onFocus={() => setEmojiOpen(false)}
              placeholder={t("chat:conv.messagePlaceholder")}
              placeholderTextColor={theme.secondaryText}
              accessibilityLabel={t("chat:conv.messagePlaceholder")}
              multiline
              maxLength={5000}
              style={[styles.input, { color: theme.text }]}
            />
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("chat:conv.sendMessage")}
            accessibilityState={{
              disabled: !text.trim() || sending,
              busy: sending,
            }}
            disabled={!text.trim() || sending}
            onPress={send}
            style={[
              styles.send,
              {
                backgroundColor:
                  text.trim() && !sending ? selectedTheme.accent : theme.border,
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <MaterialCommunityIcons
                name="arrow-up"
                size={25}
                color={text.trim() ? "#FFF" : theme.secondaryText}
              />
            )}
          </TouchableOpacity>
        </View>
        {emojiOpen && !keyboardOpen && (
          <ChatEmojiPanel
            onSelect={(emoji) => replaceSelection(emoji)}
            onBackspace={() => replaceSelection("", true)}
          />
        )}
      </View>
      <ChatMessageActionSheet
        actions={messageActions}
        onClose={() => setMessageActions(null)}
      />
      <ChatSettingsSheet
        visible={settingsOpen}
        value={themeKey}
        saving={themeSaving}
        unavailable={themeUnavailable}
        onClose={() => setSettingsOpen(false)}
        onChange={changeTheme}
      />
      <ChatAttachmentSheet
        visible={attachmentOpen}
        onClose={() => setAttachmentOpen(false)}
        onImage={() => void pickImage()}
        onDocument={() => void pickDocument()}
        onPoll={() => setPollOpen(true)}
      />
      <CreatePollModal
        visible={pollOpen}
        onClose={() => {
          pollDraft.current = null;
          setPollOpen(false);
        }}
        onCreate={createPoll}
      />
      <Modal
        visible={media !== null}
        animationType="fade"
        onRequestClose={() => {
          if (!sending) setMedia(null);
        }}
      >
        <View
          style={[
            styles.viewer,
            {
              paddingTop: insets.top,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerTitle}>
              {media?.asset ? t("chat:conv.sendPhoto") : t("chat:conv.photo")}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t("chat:conv.closePhoto")}
              disabled={sending}
              onPress={() => setMedia(null)}
              style={styles.icon}
            >
              <MaterialCommunityIcons name="close" size={25} color="#FFF" />
            </TouchableOpacity>
          </View>
          <ScrollView
            key={media?.uri}
            minimumZoomScale={1}
            maximumZoomScale={3}
            centerContent
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          >
            <Image
              source={media ? { uri: media.uri } : undefined}
              resizeMode="contain"
              style={{
                width,
                height: height - insets.top - insets.bottom - 140,
              }}
              onError={() =>
                Alert.alert(
                  t("chat:conv.photoUnavailable"),
                  t("chat:conv.photoLoadFailed")
                )
              }
            />
          </ScrollView>
          {media?.asset && (
            <TouchableOpacity
              accessibilityRole="button"
              disabled={sending}
              accessibilityLabel={t("chat:conv.sendPhoto")}
              onPress={() => void sendImage()}
              style={[
                styles.photoSend,
                { backgroundColor: selectedTheme.accent },
              ]}
            >
              {sending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text
                  style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}
                >
                  {t("chat:conv.sendPhoto")}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerDetails: { flex: 1, flexDirection: "row", alignItems: "center" },
  headerText: { flex: 1, marginLeft: 12 },
  title: { fontSize: 17, fontWeight: "600" },
  status: { fontSize: 12, marginTop: 3 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { padding: 12 },
  messages: { paddingHorizontal: 12, paddingVertical: 16, flexGrow: 1 },
  listArea: { flex: 1 },
  newMessages: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  newMessagesText: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  empty: { alignItems: "center", padding: 48 },
  composerWrap: { paddingTop: 8, paddingHorizontal: 8 },
  composerRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  inputPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    minHeight: 46,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 24,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 120,
    minHeight: 44,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  reply: {
    borderLeftWidth: 3,
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 8,
    paddingLeft: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  viewer: { flex: 1, backgroundColor: "#0B1018" },
  viewerHeader: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewerTitle: { color: "#FFF", fontSize: 17, fontWeight: "600" },
  photoSend: {
    marginHorizontal: 24,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
