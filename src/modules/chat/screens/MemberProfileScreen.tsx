// @refresh reset
import { getChatUserId, sameChatId } from "../identity";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../common/auth/context/AuthContext";
import { useChatColors } from "../components/chatUiTokens";
import ChatAvatar from "../components/ChatAvatar";
import { fetchChatPresence } from "../api/chatApi";
import { chatSocket } from "../services/chatSocket";
import type { ChatStackParamList } from "../types";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "../../../i18n/format";

type Route = NativeStackScreenProps<
  ChatStackParamList,
  "MemberProfile"
>["route"];
type Navigation = NativeStackNavigationProp<ChatStackParamList>;

export default function MemberProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<Route>();
  const { member } = params;
  const { user } = useAuth();
  const currentUserId = getChatUserId(user);
  const theme = useChatColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isMe = sameChatId(member.user_id, currentUserId);
  const [online, setOnline] = useState(false);
  const [presenceKnown, setPresenceKnown] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const presenceVersion = useRef(0);
  const active = useRef(false);

  const refreshPresence = useCallback(async () => {
    if (isMe) return;
    const version = presenceVersion.current;
    try {
      const [state] = await fetchChatPresence([member.user_id]);
      if (!active.current || version !== presenceVersion.current || !state ||
          !sameChatId(state.user_id, member.user_id)) return;
      setOnline(Boolean(state.online));
      setPresenceKnown(true);
      setLastSeen(state.last_seen_at || null);
    } catch { /* Keep last known status */ }
  }, [member.user_id, isMe]);

  useEffect(() => {
    active.current = true;
    const unsub = chatSocket.subscribe((event) => {
      if (isMe) return;
      if (event.type === "presence" && sameChatId(event.data?.user_id, member.user_id)) {
        presenceVersion.current++;
        setOnline(Boolean(event.data?.online));
        setPresenceKnown(true);
        setLastSeen(event.data?.last_seen_at || null);
      }
      if (event.type === "connected" && Array.isArray(event.data?.online_user_ids)) {
        presenceVersion.current++;
        setOnline(event.data.online_user_ids.some((id: number) => sameChatId(id, member.user_id)));
        setPresenceKnown(true);
      }
      if (event.type === "resync") void refreshPresence();
    });
    chatSocket.ensureConnected();
    void refreshPresence();
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") { chatSocket.ensureConnected(); void refreshPresence(); }
    });
    const poll = setInterval(() => {
      if (AppState.currentState !== "background" && AppState.currentState !== "inactive") void refreshPresence();
    }, 15000);
    return () => { active.current = false; unsub(); appState.remove(); clearInterval(poll); };
  }, [member.user_id, isMe, refreshPresence]);

  const status = isMe ? t("chat:member.yourProfile") : !presenceKnown ? t("chat:conv.checkingStatus")
    : online ? t("chat:conv.online")
    : lastSeen && Number.isFinite(new Date(lastSeen).getTime())
      ? t("chat:conv.lastSeen", { time: formatDateTime(lastSeen, { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }) })
      : t("chat:conv.offline");

  const details = [
    {
      icon: "office-building-outline",
      label: t("chat:member.department"),
      value: member.department,
    },
    {
      icon: "briefcase-outline",
      label: t("chat:member.role"),
      value:
        member.job_role ||
        (member.role !== "admin" && member.role !== "member"
          ? member.role
          : null),
    },
  ].filter((item) => Boolean(item.value));

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 7,
            backgroundColor: theme.card,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("common:actions.goBack")}
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={25}
            color={theme.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t("chat:member.profile")}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={styles.summary}>
          <ChatAvatar name={member.name} uri={member.user_image} size={104} online={!isMe && online} />
          <Text style={[styles.name, { color: theme.text }]}>
            {member.name}
            {isMe ? t("chat:group.youSuffix") : ""}
          </Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            {[member.job_role, member.department].filter(Boolean).join(" · ") ||
              t("chat:newChat.coworker")}
          </Text>
          <Text style={[styles.subtitle, { color: online && !isMe ? "#22C55E" : theme.secondaryText }]}>
            {status}
          </Text>
          {member.role === "admin" ? (
            <View style={[styles.adminBadge, { borderColor: theme.primary }]}>
              <MaterialCommunityIcons
                name="shield-account-outline"
                size={15}
                color={theme.primary}
              />
              <Text style={[styles.adminText, { color: theme.primary }]}>
                {t("chat:group.admin")}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          {details.length ? (
            details.map((detail, index) => (
              <View
                key={detail.label}
                style={[
                  styles.detailRow,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: `${theme.primary}18` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={detail.icon as any}
                    size={22}
                    color={theme.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.detailLabel, { color: theme.secondaryText }]}
                  >
                    {detail.label}
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {detail.value}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.noDetails, { color: theme.secondaryText }]}>
              {t("chat:member.noDetails")}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", marginLeft: 6 },
  summary: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 28,
  },
  name: { marginTop: 16, fontSize: 24, fontWeight: "800", textAlign: "center" },
  subtitle: { marginTop: 6, fontSize: 14, textAlign: "center" },
  adminBadge: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  adminText: { fontSize: 11, fontWeight: "800" },
  card: {
    marginHorizontal: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: "hidden",
  },
  detailRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  detailLabel: { fontSize: 11 },
  detailValue: { marginTop: 3, fontSize: 15, fontWeight: "700" },
  noDetails: { padding: 22, textAlign: "center", fontSize: 13 },
});