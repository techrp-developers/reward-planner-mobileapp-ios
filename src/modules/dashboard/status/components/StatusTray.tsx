import React from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { launchImageLibrary, type Asset } from "react-native-image-picker";
import { normalizeLocalCmsImageUrl } from "../../../../config/apiConfig";
import { rs } from "../../../../utils/responsive";
import type {
  StatusFeedGroup,
  StatusType,
  StatusVisibility,
  UserStatus,
} from "../types";

type Props = {
  groups: StatusFeedGroup[];
  loading: boolean;
  error: boolean;
  currentUserId: number | null;
  currentUserName?: string;
  currentUserImage?: string | null;
  currentCompanyName?: string | null;
  onRetry: () => void;
  onViewed: (statusId: number) => void;
  profileMode?: boolean;
};

const UNSEEN = ["#4B0082", "#6A00FF", "#FF2D7A", "#FFC83D"];
const VISIBILITY: Array<{ value: StatusVisibility; label: string }> = [
  { value: "same_company", label: "Same company" },
  { value: "all_companies", label: "All companies" },
  { value: "all_except_companies", label: "All except companies" },
  { value: "custom_people", label: "Custom people" },
];

const timeAgo = (value: string) => {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000)
  );
  if (!Number.isFinite(minutes)) return "";
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
};

const getCompany = (status: UserStatus, ownCompany?: string | null) => {
  const user = status.user as typeof status.user & {
    company?: { name?: string } | string;
    company_name?: string;
  };
  return (
    (typeof user.company === "string" ? user.company : user.company?.name) ||
    user.company_name ||
    ownCompany ||
    ""
  );
};

export default function StatusTray({
  groups,
  loading,
  error,
  currentUserId,
  currentUserName,
  currentUserImage,
  currentCompanyName,
  onRetry,
  onViewed,
  profileMode = false,
}: Props) {
  const [selected, setSelected] = React.useState<{
    group: number;
    status: number;
  } | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [type, setType] = React.useState<StatusType>("text");
  const [draft, setDraft] = React.useState("");
  const [media, setMedia] = React.useState<Asset | null>(null);
  const [color, setColor] = React.useState("#4B0082");
  const [font, setFont] = React.useState("default");
  const [visibility, setVisibility] =
    React.useState<StatusVisibility>("same_company");
  const progress = React.useRef(new Animated.Value(0)).current;
  const mine = groups.find((group) => group.user.id === currentUserId);
  const others = profileMode
    ? []
    : groups.filter((group) => group.user.id !== currentUserId);
  const ordered = mine ? [mine, ...others] : others;
  const active = selected
    ? ordered[selected.group]?.statuses[selected.status]
    : undefined;

  const open = React.useCallback(
    (group: number, status: number) => {
      const item = ordered[group]?.statuses[status];
      if (!item) return;
      setSelected({ group, status });
      if (!item.viewed) onViewed(item.id);
    },
    [ordered, onViewed]
  );

  const move = React.useCallback(
    (direction: 1 | -1) => {
      if (!selected) return;
      let group = selected.group;
      let status = selected.status + direction;
      if (status >= ordered[group].statuses.length) {
        group++;
        status = 0;
      }
      if (status < 0) {
        group--;
        status = (ordered[group]?.statuses.length ?? 0) - 1;
      }
      if (ordered[group]?.statuses[status]) open(group, status);
      else setSelected(null);
    },
    [open, ordered, selected]
  );

  React.useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);
    if (!active || active.type === "video") return;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: Math.max(3, active.duration_seconds || 5) * 1000,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) move(1);
    });
    return () => animation.stop();
  }, [active?.id, progress]);

  const avatar = (uri: string | null | undefined, size: number) => {
    const normalized = normalizeLocalCmsImageUrl(uri);
    return normalized ? (
      <Image
        source={{ uri: normalized }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    ) : (
      <MaterialCommunityIcons
        name="account"
        size={size * 0.65}
        color="#6B7280"
      />
    );
  };

  const story = (group: StatusFeedGroup, index: number, own: boolean) => {
    const unseen = group.statuses.some((item) => !item.viewed);
    return (
      <Pressable
        key={group.user.id}
        style={styles.story}
        onPress={() =>
          open(
            index,
            Math.max(
              0,
              group.statuses.findIndex((item) => !item.viewed)
            )
          )
        }
      >
        <LinearGradient
          colors={unseen ? UNSEEN : ["#D1D5DB", "#D1D5DB"]}
          style={styles.ring}
        >
          <View style={styles.avatar}>
            {avatar(
              own
                ? currentUserImage || group.user.image_url
                : group.user.image_url,
              rs(55)
            )}
          </View>
        </LinearGradient>
        <Text style={styles.label} numberOfLines={1}>
          {own ? "Your Status" : group.user.name || "User"}
        </Text>
      </Pressable>
    );
  };

  const chooseMedia = async (kind: "image" | "video") => {
    const result = await launchImageLibrary({
      mediaType: kind === "image" ? "photo" : "video",
      selectionLimit: 1,
    });
    if (result.assets?.[0]) {
      setType(kind);
      setMedia(result.assets[0]);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.title}>
          {profileMode ? "My Status" : "Status / Updates"}
        </Text>
        {profileMode && (
          <Pressable onPress={() => setCreating(true)} style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={16} color="#6A00FF" />
            <Text style={styles.addText}>Add Status</Text>
          </Pressable>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {mine?.statuses.length ? (
          story(mine, 0, true)
        ) : (
          <Pressable style={styles.story} onPress={() => setCreating(true)}>
            <View style={[styles.ring, styles.emptyRing]}>
              <View style={styles.avatar}>
                {avatar(currentUserImage, rs(55))}
              </View>
              <View style={styles.plus}>
                <MaterialCommunityIcons
                  name="plus"
                  size={rs(16)}
                  color="#6A00FF"
                />
              </View>
            </View>
            <Text style={styles.label}>Your Status</Text>
          </Pressable>
        )}
        {others.map((group, index) =>
          story(group, mine ? index + 1 : index, false)
        )}
      </ScrollView>
      {profileMode && mine?.statuses.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previewRow}
        >
          {mine.statuses.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => open(0, index)}
              style={[
                styles.preview,
                { backgroundColor: item.background_color || "#4B0082" },
              ]}
            >
              {item.type === "image" && item.media_url ? (
                <Image
                  source={{
                    uri:
                      normalizeLocalCmsImageUrl(item.media_url) ||
                      item.media_url,
                  }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <MaterialCommunityIcons
                  name={
                    item.type === "video"
                      ? "play-circle-outline"
                      : "format-text"
                  }
                  size={rs(25)}
                  color="#FFFFFF"
                />
              )}
              <Text style={styles.previewLabel} numberOfLines={2}>
                {item.type === "text"
                  ? item.text || "Text status"
                  : item.type === "video"
                  ? "Video status"
                  : "Photo status"}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      {loading && !groups.length && (
        <ActivityIndicator color="#6A00FF" style={styles.feedback} />
      )}
      {error && (
        <Pressable onPress={onRetry}>
          <Text style={styles.feedback}>
            Could not load updates. Tap to retry.
          </Text>
        </Pressable>
      )}

      <Modal
        visible={!!active}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelected(null)}
      >
        {active && selected && (
          <View
            style={[
              styles.viewer,
              { backgroundColor: active.background_color || "#111827" },
            ]}
          >
            {active.type === "image" && active.media_url && (
              <Image
                source={{
                  uri:
                    normalizeLocalCmsImageUrl(active.media_url) ||
                    active.media_url,
                }}
                style={styles.media}
                resizeMode="contain"
              />
            )}
            {active.type === "text" && (
              <Text
                style={[
                  styles.statusText,
                  {
                    fontStyle:
                      active.font_style === "italic" ? "italic" : "normal",
                    fontWeight: active.font_style === "bold" ? "800" : "600",
                  },
                ]}
              >
                {active.text}
              </Text>
            )}
            {active.type === "video" && (
              <View style={styles.video}>
                <MaterialCommunityIcons
                  name="play-circle-outline"
                  size={64}
                  color="#FFFFFF"
                />
                <Text style={styles.videoText}>Video status</Text>
                <Pressable
                  onPress={() => {
                    const url = normalizeLocalCmsImageUrl(active.media_url);
                    if (url) Linking.openURL(url).catch(() => undefined);
                  }}
                >
                  <Text style={styles.videoLink}>Play video</Text>
                </Pressable>
              </View>
            )}
            <View style={styles.viewerHeader}>
              <View style={styles.progressRow}>
                {ordered[selected.group].statuses.map((item, index) => (
                  <View key={item.id} style={styles.progressTrack}>
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          width:
                            index < selected.status
                              ? "100%"
                              : index > selected.status
                              ? "0%"
                              : progress.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ["0%", "100%"],
                                }),
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
              <View style={styles.identity}>
                <View style={styles.smallAvatar}>
                  {avatar(active.user.image_url, rs(32))}
                </View>
                <View style={styles.identityText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {active.user.name || currentUserName || "User"}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[
                      getCompany(
                        active,
                        active.user.id === currentUserId
                          ? currentCompanyName
                          : null
                      ),
                      timeAgo(active.created_at),
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelected(null)}
                  accessibilityLabel="Close status"
                >
                  <MaterialCommunityIcons
                    name="close"
                    color="#FFFFFF"
                    size={rs(26)}
                  />
                </Pressable>
              </View>
            </View>
            <View style={styles.tapArea}>
              <Pressable style={styles.tapHalf} onPress={() => move(-1)} />
              <Pressable style={styles.tapHalf} onPress={() => move(1)} />
            </View>
          </View>
        )}
      </Modal>

      <Modal
        visible={creating}
        animationType="slide"
        onRequestClose={() => setCreating(false)}
      >
        <ScrollView
          style={styles.create}
          contentContainerStyle={styles.createContent}
        >
          <View style={styles.createHeader}>
            <Text style={styles.createTitle}>Create Status</Text>
            <Pressable onPress={() => setCreating(false)}>
              <MaterialCommunityIcons name="close" size={26} color="#111827" />
            </Pressable>
          </View>
          <View style={styles.choices}>
            {(["text", "image", "video"] as StatusType[]).map((item) => (
              <Pressable
                key={item}
                onPress={() => setType(item)}
                style={[styles.choice, type === item && styles.selected]}
              >
                <Text style={styles.choiceText}>{item.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
          {type === "text" ? (
            <TextInput
              multiline
              placeholder="What's happening?"
              placeholderTextColor="#E5E7EB"
              value={draft}
              onChangeText={setDraft}
              style={[
                styles.textInput,
                {
                  backgroundColor: color,
                  fontStyle: font === "italic" ? "italic" : "normal",
                  fontWeight: font === "bold" ? "700" : "400",
                },
              ]}
            />
          ) : (
            <Pressable onPress={() => chooseMedia(type)} style={styles.picker}>
              {media?.uri && media.type?.startsWith("image/") ? (
                <Image
                  source={{ uri: media.uri }}
                  style={styles.mediaPreview}
                  resizeMode="contain"
                />
              ) : (
                <MaterialCommunityIcons
                  name={type === "video" ? "video-plus" : "image-plus"}
                  size={44}
                  color="#6A00FF"
                />
              )}
              <Text style={styles.pickerText}>
                {media?.fileName || `Choose ${type}`}
              </Text>
            </Pressable>
          )}
          <Text style={styles.field}>Background color</Text>
          <View style={styles.choices}>
            {["#4B0082", "#6A00FF", "#FF2D7A", "#FFC83D", "#111827"].map(
              (item) => (
                <Pressable
                  key={item}
                  onPress={() => setColor(item)}
                  style={[
                    styles.color,
                    { backgroundColor: item },
                    color === item && styles.colorSelected,
                  ]}
                />
              )
            )}
          </View>
          <Text style={styles.field}>Font style</Text>
          <View style={styles.choices}>
            {["default", "italic", "bold"].map((item) => (
              <Pressable
                key={item}
                onPress={() => setFont(item)}
                style={[styles.choice, font === item && styles.selected]}
              >
                <Text style={styles.choiceText}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.field}>Audience</Text>
          <View style={styles.choices}>
            {VISIBILITY.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setVisibility(item.value)}
                style={[
                  styles.choice,
                  visibility === item.value && styles.selected,
                ]}
              >
                <Text style={styles.choiceText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            disabled
            style={styles.postDisabled}
            accessibilityLabel="Post status unavailable until publishing is connected"
          >
            <Text style={styles.postText}>Post Status</Text>
          </Pressable>
          <Text style={styles.notice}>
            Publishing is not available yet. This draft is not uploaded.
          </Text>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: rs(18),
    marginHorizontal: rs(12),
    marginTop: rs(12),
    paddingVertical: rs(14),
    shadowColor: "#111827",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  head: {
    paddingHorizontal: rs(16),
    marginBottom: rs(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: "#111827", fontSize: rs(16), fontWeight: "800" },
  row: { paddingHorizontal: rs(12), gap: rs(10) },
  story: { width: rs(72), alignItems: "center" },
  ring: {
    width: rs(68),
    height: rs(68),
    borderRadius: rs(34),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyRing: { backgroundColor: "#D1D5DB" },
  avatar: {
    width: rs(62),
    height: rs(62),
    borderRadius: rs(31),
    borderWidth: rs(3),
    borderColor: "#FFFFFF",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  plus: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: rs(24),
    height: rs(24),
    borderRadius: rs(12),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FFC83D",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#111827",
    fontSize: rs(11),
    fontWeight: "600",
    marginTop: rs(5),
    maxWidth: rs(72),
    textAlign: "center",
  },
  feedback: { color: "#6A00FF", textAlign: "center", marginTop: rs(8) },
  previewRow: { paddingHorizontal: rs(12), paddingTop: rs(12), gap: rs(8) },
  preview: {
    width: rs(96),
    height: rs(98),
    borderRadius: rs(12),
    padding: rs(8),
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  previewLabel: {
    color: "#FFFFFF",
    fontSize: rs(10),
    fontWeight: "700",
    marginTop: rs(5),
  },
  addButton: { flexDirection: "row", alignItems: "center", gap: 3 },
  addText: { color: "#6A00FF", fontWeight: "700" },
  viewer: { flex: 1, alignItems: "center", justifyContent: "center" },
  media: { width: "100%", height: "100%" },
  statusText: {
    color: "#FFFFFF",
    fontSize: rs(28),
    textAlign: "center",
    padding: rs(25),
  },
  viewerHeader: {
    position: "absolute",
    top: rs(60),
    left: rs(14),
    right: rs(14),
    zIndex: 5,
  },
  progressRow: { flexDirection: "row", gap: rs(4), height: rs(3) },
  progressTrack: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#FFFFFF" },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(9),
    marginTop: rs(12),
  },
  smallAvatar: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  identityText: { flex: 1 },
  name: { color: "#FFFFFF", fontSize: rs(14), fontWeight: "800" },
  meta: { color: "#E5E7EB", fontSize: rs(11) },
  tapArea: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 2,
  },
  tapHalf: { flex: 1 },
  video: { alignItems: "center", gap: rs(10), zIndex: 3 },
  videoText: { color: "#FFFFFF", fontSize: rs(17) },
  videoLink: { color: "#FFC83D", fontSize: rs(15) },
  create: { flex: 1, backgroundColor: "#FFFFFF" },
  createContent: {
    paddingHorizontal: rs(18),
    paddingTop: rs(60),
    paddingBottom: rs(35),
  },
  createHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  createTitle: { color: "#111827", fontSize: rs(22), fontWeight: "800" },
  choices: {
    flexDirection: "row",
    gap: rs(8),
    flexWrap: "wrap",
    marginTop: rs(8),
  },
  choice: {
    paddingHorizontal: rs(11),
    paddingVertical: rs(8),
    borderRadius: rs(12),
    backgroundColor: "#F3F4F6",
  },
  selected: { backgroundColor: "#EDE9FE" },
  choiceText: { color: "#4B0082", fontSize: rs(11), fontWeight: "700" },
  textInput: {
    minHeight: rs(170),
    borderRadius: rs(16),
    marginTop: rs(18),
    padding: rs(18),
    color: "#FFFFFF",
    fontSize: rs(20),
    textAlignVertical: "center",
  },
  picker: {
    height: rs(170),
    backgroundColor: "#F5F3FF",
    borderRadius: rs(16),
    marginTop: rs(18),
    alignItems: "center",
    justifyContent: "center",
  },
  pickerText: { color: "#6A00FF", marginTop: rs(8) },
  mediaPreview: { width: "100%", height: rs(130) },
  field: { color: "#111827", fontWeight: "800", marginTop: rs(18) },
  color: { width: rs(30), height: rs(30), borderRadius: rs(15) },
  colorSelected: { borderWidth: 3, borderColor: "#111827" },
  postDisabled: {
    backgroundColor: "#D1D5DB",
    borderRadius: rs(14),
    paddingVertical: rs(13),
    alignItems: "center",
    marginTop: rs(25),
  },
  postText: { color: "#FFFFFF", fontWeight: "800", fontSize: rs(15) },
  notice: { color: "#6B7280", marginTop: rs(10), lineHeight: rs(18) },
});
