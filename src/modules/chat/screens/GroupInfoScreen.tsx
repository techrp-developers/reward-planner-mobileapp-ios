// @refresh reset
import { getChatUserId, sameChatId } from "../identity";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../common/auth/context/AuthContext";
import { useChatColors } from "../components/chatUiTokens";
import ChatMessageActionSheet, {
  type MessageAction,
} from "../components/ChatMessageActionSheet";
import ChatAvatar from "../components/ChatAvatar";
import {
  fetchConversations,
  removeGroupImage,
  uploadGroupImage,
} from "../api/chatApi";
import { chatSocket } from "../services/chatSocket";
import { chatError } from "../utils";
import type { ChatMember, ChatStackParamList } from "../types";

type Route = NativeStackScreenProps<ChatStackParamList, "GroupInfo">["route"];
type Navigation = NativeStackNavigationProp<ChatStackParamList>;

export default function GroupInfoScreen() {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<Route>();
  const [conversation, setConversation] = useState(params.conversation);
  const { user } = useAuth();
  const currentUserId = getChatUserId(user);
  const theme = useChatColors();
  const insets = useSafeAreaInsets();
  const [imageUrl, setImageUrl] = useState(conversation.image_url || null);
  const [photoActions, setPhotoActions] = useState<MessageAction[] | null>(
    null
  );
  const [imageSaving, setImageSaving] = useState(false);
  const imageBusy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(
    () =>
      chatSocket.subscribe((event) => {
        if (event.type === "resync") {
          fetchConversations()
            .then((items) => {
              const updated = items.find(
                (item) =>
                  Number(item.conversation_id) ===
                  Number(conversation.conversation_id)
              );
              if (mounted.current && updated) {
                setConversation(updated);
                setImageUrl(updated.image_url || null);
              }
            })
            .catch(() => {});
        }
        if (
          event.type === "conversation:updated" &&
          Number(event.data?.conversation_id) ===
            Number(conversation.conversation_id)
        ) {
          setConversation((current) => ({ ...current, ...event.data }));
          if ("image_url" in (event.data || {}))
            setImageUrl(event.data.image_url || null);
        }
      }),
    [conversation.conversation_id]
  );

  const pickGroupImage = async () => {
    if (imageBusy.current) return;
    imageBusy.current = true;
    setImageSaving(true);
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        selectionLimit: 1,
        quality: 0.9,
      });
      if (result.didCancel) return;
      if (result.errorCode)
        throw new Error(
          result.errorMessage || "The photo library is unavailable."
        );
      const asset = result.assets?.[0];
      if (!asset?.uri || !mounted.current) return;
      const updated = await uploadGroupImage(conversation.conversation_id, {
        uri: asset.uri,
        type: asset.type,
        fileName: asset.fileName,
      });
      if (mounted.current) setImageUrl(updated.image_url);
      chatSocket.requestResync();
    } catch (error) {
      if (mounted.current)
        Alert.alert("Photo not updated", chatError(error, "Please try again."));
    } finally {
      imageBusy.current = false;
      if (mounted.current) setImageSaving(false);
    }
  };
  const deleteGroupImage = async () => {
    if (imageBusy.current) return;
    imageBusy.current = true;
    setImageSaving(true);
    try {
      await removeGroupImage(conversation.conversation_id);
      if (mounted.current) setImageUrl(null);
      chatSocket.requestResync();
    } catch (error) {
      if (mounted.current)
        Alert.alert("Photo not removed", chatError(error, "Please try again."));
    } finally {
      imageBusy.current = false;
      if (mounted.current) setImageSaving(false);
    }
  };
  const confirmRemove = () =>
    Alert.alert(
      "Remove group photo?",
      "The photo will be removed for everyone in this group.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void deleteGroupImage();
          },
        },
      ]
    );

  const changeGroupImage = () => {
    if (imageBusy.current) return;
    setPhotoActions([
      {
        text: "Choose from gallery",
        onPress: () => {
          void pickGroupImage();
        },
      },
      ...(imageUrl
        ? [
            {
              text: "Remove photo",
              style: "destructive" as const,
              onPress: confirmRemove,
            },
          ]
        : []),
    ]);
  };

  const members = useMemo(
    () =>
      [...conversation.members].sort((left, right) => {
        const roleOrder =
          Number(right.role === "admin") - Number(left.role === "admin");
        return roleOrder || left.name.localeCompare(right.name);
      }),
    [conversation.members]
  );

  const renderMember = ({ item }: { item: ChatMember }) => {
    const isMe = sameChatId(item.user_id, currentUserId);
    const isAdmin = item.role === "admin";
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name}'s profile`}
        activeOpacity={0.7}
        onPress={() => navigation.navigate("MemberProfile", { member: item })}
        style={[styles.memberRow, { borderBottomColor: theme.border }]}
      >
        <ChatAvatar name={item.name} uri={item.user_image} size={48} />
        <View style={styles.memberText}>
          <Text
            style={[styles.memberName, { color: theme.text }]}
            numberOfLines={1}
          >
            {item.name}
            {isMe ? " (You)" : ""}
          </Text>
          <Text
            style={[styles.memberMeta, { color: theme.secondaryText }]}
            numberOfLines={1}
          >
            {[item.department, item.job_role].filter(Boolean).join(" · ") ||
              "Group member"}
          </Text>
        </View>
        {isAdmin ? (
          <View style={[styles.adminBadge, { borderColor: theme.primary }]}>
            <Text style={[styles.adminText, { color: theme.primary }]}>
              Group admin
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

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
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={25}
            color={theme.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Group info
        </Text>
      </View>
      <ChatMessageActionSheet
        title="Group photo"
        actions={photoActions}
        onClose={() => setPhotoActions(null)}
      />
      <FlatList
        data={members}
        scrollEnabled
        showsVerticalScrollIndicator
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={9}
        removeClippedSubviews={false}
        keyExtractor={(item) => String(item.user_id)}
        renderItem={renderMember}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        ListHeaderComponent={
          <>
            <View style={styles.groupSummary}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Change group photo"
                activeOpacity={0.8}
                onPress={changeGroupImage}
                disabled={imageSaving}
              >
                <ChatAvatar
                  name={conversation.name || "Group"}
                  uri={imageUrl}
                  size={104}
                />
                {imageSaving ? (
                  <View style={styles.imageOverlay}>
                    <ActivityIndicator color="#FFF" />
                  </View>
                ) : null}
                <View
                  style={[
                    styles.cameraBadge,
                    {
                      backgroundColor: theme.primary,
                      borderColor: theme.background,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="camera"
                    size={15}
                    color="#FFF"
                  />
                </View>
              </TouchableOpacity>
              <Text style={[styles.groupName, { color: theme.text }]}>
                {conversation.name || "Group chat"}
              </Text>
              <Text
                style={[styles.memberCount, { color: theme.secondaryText }]}
              >
                {members.length} members
              </Text>
              {conversation.description ? (
                <Text
                  style={[styles.description, { color: theme.secondaryText }]}
                >
                  {conversation.description}
                </Text>
              ) : null}
            </View>
            <View
              style={[
                styles.sectionHeader,
                { borderBottomColor: theme.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {members.length} participants
              </Text>
            </View>
          </>
        }
      />
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
  content: { paddingBottom: 30 },
  groupSummary: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 52,
    backgroundColor: "rgba(0,0,0,.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  groupName: {
    marginTop: 14,
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
  },
  memberCount: { marginTop: 5, fontSize: 13 },
  description: {
    marginTop: 13,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800" },
  memberRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  memberText: { flex: 1, marginLeft: 13, marginRight: 8 },
  memberName: { fontSize: 15, fontWeight: "700" },
  memberMeta: { marginTop: 4, fontSize: 12 },
  adminBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  adminText: { fontSize: 11, fontWeight: "600" },
});
