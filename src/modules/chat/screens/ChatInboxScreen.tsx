// @refresh reset
import { getChatUserId, sameChatId } from "../identity";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../common/auth/context/AuthContext";
import { fetchChatPresence, fetchConversations } from "../api/chatApi";
import ChatAvatar from "../components/ChatAvatar";
import { useChatColors } from "../components/chatUiTokens";
import { chatError, chatTime, conversationTitle, otherMember, conversationMatchesQuery } from "../utils";
import type { ChatConversation, ChatStackParamList } from "../types";
import { chatSocket } from "../services/chatSocket";
import BottomTabs, {
  TAB_BAR_HEIGHT,
  type TabKey,
} from "../../../bottombar/BottomTabs";

type Navigation = NativeStackNavigationProp<ChatStackParamList>;
export default function ChatInboxScreen() {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const currentUserId = getChatUserId(user);
  const theme = useChatColors();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ChatConversation[]>([]);
  const [presence, setPresence] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const active = useRef(false);
  const generation = useRef(0);
  const fetching = useRef(false);
  const pendingLoad = useRef(false);
  const latestLoad = useRef<(refresh?: boolean) => Promise<void>>(async () => {});
  const appNavigation = navigation.getParent<any>();
  const handleFooterPress = (tab: TabKey) => {
    if (tab === "Notes") appNavigation?.navigate("TodoList");
  };
  const load = useCallback(
    async (refresh = false) => {
      if (fetching.current) { pendingLoad.current = true; if (refresh) setRefreshing(true); return; }
      fetching.current = true;
      const request = ++generation.current;
      if (refresh) setRefreshing(true);
      try {
        const conversations = await fetchConversations();
        if (!active.current || generation.current !== request) return;
        setItems(conversations);
        setError("");
        const ids = [
          ...new Set(
            conversations
              .filter((item) => item.type === "direct")
              .map((item) => otherMember(item, currentUserId)?.user_id)
              .filter((value): value is number => Boolean(value))
          ),
        ];
        const states = await fetchChatPresence(ids).catch(() => []);
        if (active.current && generation.current === request)
          setPresence((current) => ({
            ...current,
            ...Object.fromEntries(
              states.map((state) => [state.user_id, state.online])
            ),
          }));
      } catch (failure) {
        if (active.current && generation.current === request)
          setError(chatError(failure, "Unable to load conversations."));
      } finally {
        fetching.current = false;
        if (active.current && generation.current === request) {
          setLoading(false);
          setRefreshing(false);
        }
        if (pendingLoad.current && active.current && AppState.currentState !== "background" && AppState.currentState !== "inactive") {
          pendingLoad.current = false;
          void latestLoad.current();
        }
      }
    },
    [currentUserId]
  );
  latestLoad.current = load;
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      void load();
      const poll = setInterval(() => {
        if (AppState.currentState === "active" && !chatSocket.isConnected())
          void load();
      }, 10000);
      const unsubscribe = chatSocket.subscribe((event) => {
        if (event.type === "presence") {
          setPresence((current) => ({
            ...current,
            [Number(event.data?.user_id)]: Boolean(event.data?.online),
          }));
          return;
        }
        if (
          event.type === "connected" &&
          Array.isArray(event.data?.online_user_ids)
        )
          setPresence(
            Object.fromEntries(
              event.data.online_user_ids.map((id: number) => [id, true])
            )
          );
        if (
          event.type === "conversation:theme" ||
          event.type === "conversation:updated"
        )
          setItems((current) =>
            current.map((item) =>
              Number(item.conversation_id) ===
              Number(event.data?.conversation_id)
                ? { ...item, ...event.data }
                : item
            )
          );
        if (
          [
            "message:new",
            "message:deleted",
            "message:read",
            "conversation:available",
            "conversation:updated",
            "resync",
          ].includes(event.type)
        )
          void load();
      });
      return () => {
        active.current = false;
        generation.current++;
        pendingLoad.current = false;
        clearInterval(poll);
        unsubscribe();
      };
    }, [load])
  );
  const filtered = useMemo(() => {
    return items
      .filter(item => conversationMatchesQuery(item, query, currentUserId))
      .sort(
        (a, b) =>
          (new Date(b.last_message_at || b.updated_at).getTime() || 0) -
          (new Date(a.last_message_at || a.updated_at).getTime() || 0)
      );
  }, [items, query, currentUserId]);
  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={[styles.title, { color: theme.text }]}>Chats</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            Stay connected with your team
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Start a new chat"
          onPress={() => navigation.navigate("NewChat")}
          style={[styles.newChat, { backgroundColor: `${theme.primary}12` }]}
        >
          <MaterialCommunityIcons
            name="square-edit-outline"
            size={25}
            color={theme.primary}
          />
        </TouchableOpacity>
      </View>
      <View
        style={[
          styles.search,
          {
            backgroundColor: theme.card,
            borderColor: searchFocused ? theme.primary : theme.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={23}
          color={theme.secondaryText}
        />
        <TextInput
          accessibilityLabel="Search people or groups"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search people or groups"
          placeholderTextColor={theme.secondaryText}
          style={[styles.input, { color: theme.text }]}
          returnKeyType="search"
          autoCorrect={false}
        />
        {!!query && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setQuery("")}
            style={styles.clear}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={theme.secondaryText}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && items.length > 0 && (
        <TouchableOpacity
          onPress={() => void load(true)}
          style={{ paddingHorizontal: 24, paddingVertical: 8 }}
        >
          <Text style={{ color: theme.secondaryText }}>
            {error} Tap to retry.
          </Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.conversation_id)}
        initialNumToRender={15}
        maxToRenderPerBatch={12}
        windowSize={9}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item }) => {
          const member = otherMember(item, currentUserId);
          const name = conversationTitle(item, currentUserId);
          const sender =
            item.type === "group" && item.last_sender_id
              ? item.members
                  .find(
                    (person) =>
                      Number(person.user_id) === Number(item.last_sender_id)
                  )
                  ?.name.split(" ")[0]
              : null;
          const preview =
            item.last_message_type === "image"
              ? "Photo"
              : item.last_message_type === "file"
              ? "Shared a document"
              : item.last_message_type === "poll"
              ? "Poll"
              : item.last_message || "No messages yet";
          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`${name}, ${preview}${
                item.unread_count ? `, ${item.unread_count} unread` : ""
              }`}
              onPress={() =>
                navigation.navigate("ChatConversation", { conversation: item })
              }
              style={styles.row}
            >
              <View>
                <ChatAvatar
                  name={name}
                  uri={
                    item.type === "group" ? item.image_url : member?.user_image
                  }
                  online={
                    item.type === "direct" &&
                    Boolean(member && presence[member.user_id])
                  }
                  size={54}
                />
                {item.type === "group" && (
                  <View
                    style={[styles.groupBadge, { backgroundColor: theme.card }]}
                  >
                    <MaterialCommunityIcons
                      name="account-group"
                      size={13}
                      color={theme.primary}
                    />
                  </View>
                )}
              </View>
              <View
                style={[styles.rowBody, { borderBottomColor: theme.border }]}
              >
                <View style={styles.rowTop}>
                  <Text
                    numberOfLines={1}
                    style={[styles.name, { color: theme.text }]}
                  >
                    {name}
                  </Text>
                  <Text
                    style={[
                      styles.time,
                      {
                        color: item.unread_count
                          ? theme.primary
                          : theme.secondaryText,
                      },
                    ]}
                  >
                    {chatTime(item.last_message_at || item.updated_at)}
                  </Text>
                </View>
                <View style={styles.rowBottom}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.preview,
                      {
                        color: item.unread_count
                          ? theme.text
                          : theme.secondaryText,
                        fontWeight: item.unread_count ? "500" : "400",
                      },
                    ]}
                  >
                    {sender ? `${sender}: ` : ""}
                    {preview}
                  </Text>
                  {item.unread_count > 0 && (
                    <View
                      style={[styles.badge, { backgroundColor: "#6A00FF" }]}
                    >
                      <Text style={styles.badgeText}>
                        {item.unread_count > 99 ? "99+" : item.unread_count}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <>
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: `${theme.primary}12` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      error ? "message-alert-outline" : "message-text-outline"
                    }
                    size={34}
                    color={theme.primary}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  {error
                    ? "Couldn’t load chats"
                    : query.trim()
                    ? "No chats found"
                    : "Start a conversation"}
                </Text>
                <Text
                  style={[styles.emptyText, { color: theme.secondaryText }]}
                >
                  {error ||
                    (query.trim()
                      ? "Try another person or group name."
                      : "Message a coworker or bring your team together.")}
                </Text>
                {error && (
                  <TouchableOpacity
                    onPress={() => void load(true)}
                    style={styles.clear}
                  >
                    <Text style={{ color: theme.primary, fontWeight: "600" }}>
                      Try again
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        }
      />
      <BottomTabs
        isDashboard
        activeTabKey="Chat"
        onTabPress={handleFooterPress}
        onCenterPress={() => appNavigation?.navigate("Dashboard")}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.6 },
  subtitle: { fontSize: 13, marginTop: 4 },
  newChat: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    marginHorizontal: 20,
    marginBottom: 12,
    minHeight: 48,
    borderRadius: 24,
    paddingLeft: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15 },
  clear: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { flexGrow: 1, paddingHorizontal: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 84 },
  rowBody: {
    flex: 1,
    justifyContent: "center",
    minHeight: 84,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  name: { flex: 1, fontSize: 16, fontWeight: "600" },
  time: { fontSize: 11 },
  preview: { flex: 1, fontSize: 14 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#FFF", fontSize: 11, fontWeight: "600" },
  groupBadge: {
    position: "absolute",
    right: -2,
    bottom: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: "center",
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { marginTop: 20, fontSize: 20, fontWeight: "600" },
  emptyText: {
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21,
    fontSize: 14,
  },
});
