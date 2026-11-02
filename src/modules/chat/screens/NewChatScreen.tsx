// @refresh reset
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  createConversation,
  fetchChatUsers,
  fetchConversations,
} from "../api/chatApi";
import { useAuth } from "../../common/auth/context/AuthContext";
import {
  getChatUserId,
  normalizeChatId,
  sameChatId,
  uniqueChatRecords,
} from "../identity";
import { chatSocket } from "../services/chatSocket";
import ChatAvatar from "../components/ChatAvatar";
import { useChatColors } from "../components/chatUiTokens";
import type { ChatStackParamList, ChatUser } from "../types";
import { chatError, findDirectConversation } from "../utils";
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";

type Navigation = NativeStackNavigationProp<ChatStackParamList>;
export default function NewChatScreen() {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const currentUserId = getChatUserId(user);
  const theme = useChatColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [creating, setCreating] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const created = useRef<{ key: string; id: number } | null>(null);
  const [groupMode, setGroupMode] = useState(false);
  const [selected, setSelected] = useState<ChatUser[]>([]);
  const [groupName, setGroupName] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(
      async () => {
        try {
          const data = await fetchChatUsers(query.trim());
          if (active) {
            setUsers(
              uniqueChatRecords(data, (person) => person.user_id).filter(
                (person) => !sameChatId(person.user_id, currentUserId)
              )
            );
            setError("");
          }
        } catch (failure) {
          if (active) setError(chatError(failure, i18n.t("chat:newChat.loadError")));
        } finally {
          if (active) setLoading(false);
        }
      },
      query ? 250 : 0
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, reload, currentUserId]);
  const open = async (ids: number[], name?: string) => {
    if (inFlight.current) return;
    if (currentUserId === undefined) {
      Alert.alert(
        i18n.t("chat:conv.accountUnavailable"),
        i18n.t("chat:conv.identityFailed")
      );
      return;
    }
    ids = [
      ...new Set(
        ids
          .map(normalizeChatId)
          .filter(
            (value): value is number =>
              value !== undefined && value !== currentUserId
          )
      ),
    ];
    if (
      !ids.length ||
      (name !== undefined && (!name.trim() || ids.length < 2))
    ) {
      Alert.alert(
        i18n.t("chat:newChat.chooseTitle"),
        i18n.t("chat:newChat.chooseBody")
      );
      return;
    }
    const key = `${[...ids].sort((a, b) => a - b).join(",")}:${name?.trim() || ""}`;
    let establishedId = created.current?.key === key ? created.current.id : undefined;
    inFlight.current = true;
    setCreating(true);
    Keyboard.dismiss();
    try {
      if (name === undefined && establishedId === undefined) {
        const existing = findDirectConversation(
          await fetchConversations(),
          currentUserId,
          ids[0]
        );
        if (existing) {
          if (mounted.current)
            navigation.replace("ChatConversation", { conversation: existing });
          return;
        }
      }
      const id =
        created.current?.key === key
          ? created.current.id
          : await createConversation(ids, name);
      establishedId = id;
      created.current = { key, id };
      chatSocket.requestResync();
      const conversations = await fetchConversations();
      const conversation = conversations.find(
        (item) => Number(item.conversation_id) === Number(id)
      );
      if (!conversation)
        throw new Error(
          i18n.t("chat:newChat.createdRetry")
        );
      if (mounted.current)
        navigation.replace("ChatConversation", { conversation });
    } catch (failure) {
      if (mounted.current)
        Alert.alert(
          establishedId ? i18n.t("chat:newChat.created") : i18n.t("chat:newChat.openFailed"),
          establishedId
            ? i18n.t("chat:newChat.createdDetailsFailed")
            : chatError(failure, i18n.t("common:errors.generic"))
        );
    } finally {
      inFlight.current = false;
      if (mounted.current) setCreating(false);
    }
  };
  const toggle = (person: ChatUser) =>
    setSelected((current) =>
      current.some((item) => sameChatId(item.user_id, person.user_id))
        ? current.filter((item) => !sameChatId(item.user_id, person.user_id))
        : [...current, person]
    );
  const canCreate =
    selected.length >= 2 && Boolean(groupName.trim()) && !creating;
  return (
    <KeyboardAvoidingView
      style={[
        styles.screen,
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={groupMode ? t("chat:newChat.backToNew") : t("chat:conv.backToChats")}
          disabled={creating}
          onPress={() =>
            groupMode
              ? (setGroupMode(false), setSelected([]), setGroupName(""))
              : navigation.goBack()
          }
          style={styles.icon}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={30}
            color={theme.primary}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>
            {groupMode ? t("chat:newChat.newGroup") : t("chat:newChat.newChat")}
          </Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            {groupMode
              ? t("chat:newChat.selected", { count: selected.length })
              : t("chat:newChat.findCoworker")}
          </Text>
        </View>
        {groupMode && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("chat:newChat.createGroup")}
            disabled={!canCreate}
            onPress={() =>
              void open(
                selected.map((person) => person.user_id),
                groupName.trim()
              )
            }
            style={[
              styles.create,
              { backgroundColor: canCreate ? "#6A00FF" : theme.border },
            ]}
          >
            {creating ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <Text
                style={{
                  color: canCreate ? "#FFF" : theme.secondaryText,
                  fontWeight: "600",
                }}
              >
                {t("chat:newChat.create")}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      {!groupMode ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setGroupMode(true)}
          style={styles.groupRow}
        >
          <View
            style={[
              styles.groupIcon,
              { backgroundColor: `${theme.primary}14` },
            ]}
          >
            <MaterialCommunityIcons
              name="account-multiple-plus-outline"
              size={25}
              color={theme.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.groupTitle, { color: theme.text }]}>
              {t("chat:newChat.newGroup")}
            </Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              {t("chat:newChat.bringTeam")}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={theme.secondaryText}
          />
        </TouchableOpacity>
      ) : (
        <View style={{ paddingHorizontal: 20 }}>
          <TextInput
            accessibilityLabel={t("chat:newChat.groupName")}
            editable={!creating}
            value={groupName}
            onChangeText={setGroupName}
            placeholder={t("chat:newChat.groupName")}
            placeholderTextColor={theme.secondaryText}
            maxLength={120}
            style={[
              styles.groupName,
              {
                color: theme.text,
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          />
          <Text style={[styles.hint, { color: theme.secondaryText }]}>
            {i18n.t("chat:r2.chooseAtLeastTwoCoworkers")}
          </Text>
          {selected.length > 0 && (
            <ScrollView
              horizontal
              style={styles.selected}
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {selected.map((person) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={t("chat:newChat.remove", { name: person.name })}
                  key={person.user_id}
                  disabled={creating}
                  onPress={() => toggle(person)}
                  style={[
                    styles.chip,
                    { backgroundColor: `${theme.primary}12` },
                  ]}
                >
                  <Text style={{ color: theme.primary, fontSize: 13 }}>
                    {person.name}
                  </Text>
                  <MaterialCommunityIcons
                    name="close"
                    size={16}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
      <View style={[styles.search, { backgroundColor: theme.card }]}>
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={theme.secondaryText}
        />
        <TextInput
          accessibilityLabel={t("chat:newChat.search")}
          value={query}
          onChangeText={setQuery}
          placeholder={t("chat:newChat.search")}
          placeholderTextColor={theme.secondaryText}
          style={[styles.input, { color: theme.text }]}
          autoCorrect={false}
        />
        {query && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("chat:inbox.clearSearch")}
            onPress={() => setQuery("")}
            style={styles.icon}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={19}
              color={theme.secondaryText}
            />
          </TouchableOpacity>
        )}
      </View>
      {loading && (
        <ActivityIndicator color={theme.primary} style={{ padding: 12 }} />
      )}
      {creating && !groupMode && (
        <ActivityIndicator color={theme.primary} style={{ padding: 12 }} />
      )}
      <FlatList
        data={users}
        keyExtractor={(person) => String(person.user_id)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
        }}
        initialNumToRender={15}
        renderItem={({ item }) => {
          const checked = selected.some((person) =>
            sameChatId(person.user_id, item.user_id)
          );
          return (
            <TouchableOpacity
              accessibilityRole={groupMode ? "checkbox" : "button"}
              accessibilityState={{
                checked: groupMode ? checked : undefined,
                disabled: creating,
              }}
              disabled={creating}
              onPress={() =>
                groupMode ? toggle(item) : void open([item.user_id])
              }
              style={[styles.person, { borderBottomColor: theme.border }]}
            >
              <ChatAvatar name={item.name} uri={item.user_image} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.personName, { color: theme.text }]}>
                  {item.name}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.subtitle, { color: theme.secondaryText }]}
                >
                  {[item.department, item.job_role || item.role]
                    .filter(Boolean)
                    .join(" · ") || t("chat:newChat.coworker")}
                </Text>
              </View>
              {groupMode && (
                <MaterialCommunityIcons
                  name={
                    checked ? "check-circle" : "checkbox-blank-circle-outline"
                  }
                  size={25}
                  color={checked ? theme.primary : theme.secondaryText}
                />
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: "center", padding: 40 }}>
              <Text style={{ color: theme.secondaryText, textAlign: "center" }}>
                {error || t("chat:newChat.noneFound")}
              </Text>
              {error && (
                <TouchableOpacity
                  onPress={() => setReload((value) => value + 1)}
                  style={styles.icon}
                >
                  <Text style={{ color: theme.primary }}>{t("common:actions.retry")}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 8,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 4 },
  create: {
    minWidth: 72,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  groupTitle: { fontSize: 16, fontWeight: "600" },
  groupName: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  hint: { fontSize: 12, marginTop: 8 },
  selected: { marginVertical: 12 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 8,
  },
  search: {
    marginHorizontal: 20,
    marginVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingLeft: 16,
    gap: 8,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 12 },
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 80,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  personName: { fontSize: 16, fontWeight: "600" },
});
