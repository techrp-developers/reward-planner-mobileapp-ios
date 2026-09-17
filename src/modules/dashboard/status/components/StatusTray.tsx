import React from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { normalizeLocalCmsImageUrl } from "../../../../config/apiConfig";
import { rs } from "../../../../utils/responsive";
import type {
  StatusFeedGroup,
  StatusType,
  StatusViewer,
  StatusVisibility,
  UserStatus,
} from "../types";
import { createStatus, deleteStatus, fetchStatusViewers } from "../api/statusApi";

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
  onCreated: (status: UserStatus) => void;
  onDeleted: (statusId: number) => void;
  profileMode?: boolean;
  headerMode?: boolean;
  headerTextColor?: string;
};

const UNSEEN = ["#4B0082", "#6A00FF", "#FF2D7A", "#FFC83D"];
const VISIBILITY: Array<{ value: StatusVisibility; label: string; description: string; icon: string }> = [
  { value: "same_company", label: "Same company", description: "People at your company", icon: "domain" },
  { value: "all_companies", label: "All companies", description: "Everyone on RewardsPlanners", icon: "earth" },
];

const timeAgo = (value: string) => {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value.replace(' ', 'T')).getTime()) / 60000)
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
  onCreated,
  onDeleted,
  profileMode = false,
  headerMode = false,
  headerTextColor,
}: Props) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
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
    React.useState<StatusVisibility | null>(null);
  const [posting, setPosting] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [loadingViewers, setLoadingViewers] = React.useState(false);
  const [viewers, setViewers] = React.useState<StatusViewer[] | null>(null);
  const [viewCount, setViewCount] = React.useState(0);
  const progress = React.useRef(new Animated.Value(0)).current;
  const progressValue = React.useRef(0);
  const currentAnimation = React.useRef<Animated.CompositeAnimation | null>(null);
  const longPressed = React.useRef(false);
  const mine = groups.find((group) => group.user.id === currentUserId);
  const others = React.useMemo(() => profileMode
    ? []
    : groups.filter((group) => group.user.id !== currentUserId), [groups, currentUserId, profileMode]);
  const ordered = React.useMemo(() => mine ? [mine, ...others] : others, [mine, others]);
  const active = selected
    ? ordered[selected.group]?.statuses[selected.status]
    : undefined;
  const activeId = active?.id;
  const activeIdRef = React.useRef(activeId);
  activeIdRef.current = activeId;
  const activeDuration = active?.duration_seconds;
  const activeType = active?.type;
  const ownActive = active?.user.id === currentUserId;

  React.useEffect(() => {
    setViewers(null);
    setViewCount(Number(active?.view_count ?? 0));
  }, [activeId, active?.view_count]);

  const showViewers = async () => {
    if (!active || loadingViewers) return;
    setPaused(true);
    setLoadingViewers(true);
    try {
      const result = await fetchStatusViewers(active.id);
      if (activeIdRef.current !== active.id) return;
      setViewers(result.viewers);
      setViewCount(result.viewCount);
    } catch (error: any) {
      Alert.alert('Could not load views', error?.response?.data?.message || error?.message || 'Please try again.');
      if (activeIdRef.current === active.id) setPaused(false);
    } finally {
      setLoadingViewers(false);
    }
  };

  const confirmDelete = () => {
    if (!active || deleting) return;
    setPaused(true);
    const statusId = active.id;
    Alert.alert('Delete status?', 'This status will be removed immediately.', [
      { text: 'Cancel', style: 'cancel', onPress: () => setPaused(false) },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeleting(true);
        try {
          await deleteStatus(statusId);
          setSelected(null);
          onDeleted(statusId);
        } catch (error: any) {
          Alert.alert('Could not delete status', error?.response?.data?.message || error?.message || 'Please try again.');
          setPaused(false);
        } finally {
          setDeleting(false);
        }
      } },
    ], { cancelable: true, onDismiss: () => setPaused(false) });
  };

  const open = React.useCallback(
    (group: number, status: number, refreshOwn = false) => {
      const item = ordered[group]?.statuses[status];
      if (!item) return;
      if (__DEV__) console.log('👆 [STATUS] Status tray opened');
      setSelected({ group, status });
      if (refreshOwn && item.user.id === currentUserId) onRetry();
      if (!item.viewed && item.user.id !== currentUserId) onViewed(item.id);
    },
    [ordered, onViewed, onRetry, currentUserId]
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

  const moveRef = React.useRef(move);
  moveRef.current = move;

  React.useEffect(() => {
    const listener = progress.addListener(({ value }) => { progressValue.current = value; });
    return () => progress.removeListener(listener);
  }, [progress]);

  React.useEffect(() => {
    currentAnimation.current?.stop();
    progressValue.current = 0;
    progress.setValue(0);
    setPaused(false);
    return () => currentAnimation.current?.stop();
  }, [activeId, progress]);

  React.useEffect(() => {
    currentAnimation.current?.stop();
    if (!activeId || paused || deleting || viewers) return;
    const seconds = activeDuration && activeDuration > 0
      ? activeDuration
      : activeType === 'video' ? 15 : 5;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: Math.max(100, (1 - progressValue.current) * seconds * 1000),
      useNativeDriver: false,
    });
    currentAnimation.current = animation;
    animation.start(({ finished }) => {
      if (finished) moveRef.current(1);
    });
    return () => animation.stop();
  }, [activeId, activeDuration, activeType, paused, deleting, viewers, progress]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') setPaused(true);
      else setPaused(false);
    });
    return () => subscription.remove();
  }, []);

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
            ),
            true
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
        {own && (
          <Pressable onPress={event => { event.stopPropagation(); setCreating(true); }} style={styles.headerPlus} accessibilityLabel="Add Status">
            <MaterialCommunityIcons name="plus" size={rs(16)} color="#6A00FF" />
          </Pressable>
        )}
        <Text style={[styles.label, isDark && styles.darkText, headerMode && { color: headerTextColor || '#111827' }]} numberOfLines={1}>
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

  const publish = async () => {
    if (posting) return;
    if (type === 'text' && !draft.trim()) {
      Alert.alert('Add text', 'Write something before posting.');
      return;
    }
    if (type !== 'text' && !media?.uri) {
      Alert.alert('Choose media', `Choose a ${type} before posting.`);
      return;
    }
    if (!visibility) {
      Alert.alert('Choose an audience', 'Select who can see this status.');
      return;
    }
    setPosting(true);
    try {
      const status = await createStatus({
        type,
        text: draft.trim() || undefined,
        visibility,
        background_color: type === 'text' ? color : undefined,
        font_style: type === 'text' ? font : undefined,
        media: type !== 'text' && media?.uri ? {
          uri: media.uri,
          type: media.type || (type === 'image' ? 'image/jpeg' : 'video/mp4'),
          fileName: media.fileName || `status-${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`,
        } : undefined,
      });
      onCreated(status);
      setCreating(false);
      setDraft('');
      setMedia(null);
      setType('text');
      setVisibility(null);
    } catch (publishError: any) {
      Alert.alert('Could not post status', publishError?.response?.data?.message || publishError?.message || 'Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={[styles.section, isDark && styles.darkSection, headerMode && styles.headerSection]}>
      {profileMode && <View style={styles.head}>
          <Text style={[styles.title, isDark && styles.darkText]}>Status</Text>
          <Pressable onPress={() => setCreating(true)} style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={16} color="#6A00FF" />
            <Text style={styles.addText}>Add Status</Text>
          </Pressable>
      </View>}
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
            <Text style={[styles.label, isDark && styles.darkText, headerMode && { color: headerTextColor || '#111827' }]}>Your Status</Text>
            <Text style={[styles.addHint, isDark && styles.darkMuted]}>Add a status</Text>
          </Pressable>
        )}
        {others.map((group, index) =>
          story(group, mine ? index + 1 : index, false)
        )}
      </ScrollView>
      {profileMode && mine?.statuses.length ? (
        <View style={styles.previewRow}>
          {mine.statuses.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => open(0, index, true)}
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
              {Number.isFinite(item.view_count) && (
                <View style={styles.previewViews}>
                  <MaterialCommunityIcons name="eye-outline" size={rs(12)} color="#FFFFFF" />
                  <Text style={styles.previewViewsText}>{item.view_count}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
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
                resizeMode="cover"
              />
            )}
            {active.type !== 'text' && (
              <>
                <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.65)', 'transparent']} style={styles.topShade} />
                <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(0,0,0,0.58)']} style={styles.bottomShade} />
              </>
            )}
            {active.type !== 'text' && !!active.text && (
              <Text style={[styles.caption, { bottom: insets.bottom + rs(78) }]}>{active.text}</Text>
            )}
            {active.type === "text" && (
              <Text
                style={[
                  styles.statusText,
                  {
                    color: active.background_color?.toUpperCase() === '#FFC83D' ? '#111827' : '#FFFFFF',
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
            {ownActive && (
              <Pressable onPress={showViewers} disabled={loadingViewers || deleting} accessibilityLabel="Show status viewers" style={[styles.viewCount, { bottom: insets.bottom + rs(20) }]}>
                <MaterialCommunityIcons name="eye-outline" size={rs(20)} color="#FFFFFF" />
                <Text style={styles.viewCountText}>
                  {viewCount} {viewCount === 1 ? 'view' : 'views'}
                </Text>
                {loadingViewers ? <ActivityIndicator color="#FFFFFF" size="small" /> : <MaterialCommunityIcons name="chevron-up" size={rs(18)} color="#FFFFFF" />}
              </Pressable>
            )}
            <View style={[styles.viewerHeader, { top: insets.top + rs(12) }]}>
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
                {ownActive && (
                  <Pressable onPress={confirmDelete} disabled={deleting} accessibilityLabel="Delete status" hitSlop={10}>
                    {deleting ? <ActivityIndicator color="#FFFFFF" /> : <MaterialCommunityIcons name="delete-outline" color="#FFFFFF" size={rs(26)} />}
                  </Pressable>
                )}
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
              {([-1, 1] as const).map(direction => (
                <Pressable
                  key={direction}
                  style={styles.tapHalf}
                  delayLongPress={220}
                  onPressIn={() => { longPressed.current = false; }}
                  onLongPress={() => { longPressed.current = true; setPaused(true); }}
                  onPressOut={() => setPaused(false)}
                  onPress={() => {
                    if (longPressed.current) { longPressed.current = false; return; }
                    move(direction);
                  }}
                />
              ))}
            </View>
            {viewers && ownActive && (
              <View style={[styles.viewersSheet, { paddingBottom: insets.bottom + rs(16) }]}>
                <View style={styles.viewersHeading}>
                  <Text style={styles.viewersTitle}>Viewed by · {viewCount}</Text>
                  <Pressable onPress={() => { setViewers(null); setPaused(false); }} accessibilityLabel="Close viewers">
                    <MaterialCommunityIcons name="close" size={rs(24)} color="#111827" />
                  </Pressable>
                </View>
                <ScrollView>
                  {viewers.length ? viewers.map(viewer => (
                    <View key={viewer.user_id} style={styles.viewerRow}>
                      <View style={styles.viewerAvatar}>{avatar(viewer.image_url, rs(36))}</View>
                      <Text style={styles.viewerName}>{viewer.name || 'User'}</Text>
                    </View>
                  )) : <Text style={styles.emptyViewers}>No views yet</Text>}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </Modal>

      <Modal
        visible={creating}
        animationType="slide"
        onRequestClose={() => setCreating(false)}
      >
        <KeyboardAvoidingView style={[styles.create, isDark && styles.darkSection]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.createContent, { paddingTop: insets.top + rs(18) }]} keyboardShouldPersistTaps="handled">
          <View style={styles.createHeader}>
            <Text style={[styles.createTitle, isDark && styles.darkText]}>Create Status</Text>
            <Pressable onPress={() => setCreating(false)}>
              <MaterialCommunityIcons name="close" size={26} color={isDark ? '#FFFFFF' : '#111827'} />
            </Pressable>
          </View>
          <Text style={[styles.field, isDark && styles.darkText]}>Who can see this status?</Text>
          <View style={styles.audienceChoices}>
            {VISIBILITY.map(item => (
              <Pressable
                key={item.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: visibility === item.value }}
                onPress={() => setVisibility(item.value)}
                style={[styles.audienceChoice, isDark && styles.darkChoice, visibility === item.value && styles.audienceSelected, isDark && visibility === item.value && styles.darkAudienceSelected]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={rs(21)}
                  color="#6A00FF"
                />
                <View style={styles.audienceCopy}>
                  <Text style={[styles.audienceText, isDark && styles.darkText]}>{item.label}</Text>
                  <Text style={[styles.audienceDescription, isDark && styles.darkMuted]}>{item.description}</Text>
                </View>
                <MaterialCommunityIcons name={visibility === item.value ? 'check-circle' : 'circle-outline'} size={rs(16)} color={visibility === item.value ? '#6A00FF' : '#9CA3AF'} />
              </Pressable>
            ))}
          </View>
          <View style={[styles.typeChoices, isDark && styles.darkChoice]}>
            {(["text", "image", "video"] as StatusType[]).map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  if (item !== type) setMedia(null);
                  setType(item);
                }}
                style={[styles.typeChoice, type === item && styles.typeSelected]}
              >
                <Text style={[styles.choiceText, isDark && styles.darkText, type === item && styles.typeSelectedText]}>{item === 'image' ? 'PHOTO' : item.toUpperCase()}</Text>
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
                  color: color === '#FFC83D' ? '#111827' : '#FFFFFF',
                  fontStyle: font === "italic" ? "italic" : "normal",
                  fontWeight: font === "bold" ? "700" : "400",
                },
              ]}
            />
          ) : (
            <><Pressable onPress={() => chooseMedia(type)} style={[styles.picker, isDark && styles.darkChoice]}>
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
            <TextInput
              placeholder="Add a caption (optional)"
              placeholderTextColor="#6B7280"
              value={draft}
              onChangeText={setDraft}
              style={[styles.captionInput, isDark && styles.darkInput]}
            /></>
          )}
          {type === 'text' && <><Text style={[styles.field, isDark && styles.darkText]}>Background color</Text>
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
          <Text style={[styles.field, isDark && styles.darkText]}>Font style</Text>
          <View style={styles.choices}>
            {["default", "italic", "bold"].map((item) => (
              <Pressable
                key={item}
                onPress={() => setFont(item)}
                style={[styles.choice, isDark && styles.darkChoice, font === item && styles.selected, isDark && font === item && styles.darkAudienceSelected]}
              >
                <Text style={[styles.choiceText, isDark && styles.darkText]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          </>}
        </ScrollView>
          <Pressable
            disabled={posting}
            onPress={publish}
            style={[styles.postDisabled, styles.postFooter, { marginBottom: insets.bottom + rs(12) }]}
            accessibilityLabel="Post status"
          >
            <LinearGradient colors={posting ? ['#9CA3AF', '#9CA3AF'] : ['#4B0082', '#6A00FF']} style={styles.postGradient}>
              {posting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.postText}>Post Status</Text>}
            </LinearGradient>
          </Pressable>
        </KeyboardAvoidingView>
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
  darkSection: { backgroundColor: '#18181B' },
  darkText: { color: '#F9FAFB' },
  darkMuted: { color: '#A1A1AA' },
  headerSection: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginHorizontal: 0,
    marginTop: 0,
    paddingVertical: 0,
    shadowOpacity: 0,
    elevation: 0,
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
  headerPlus: {
    position: 'absolute',
    right: rs(2),
    top: rs(45),
    width: rs(24),
    height: rs(24),
    borderRadius: rs(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFC83D',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    color: "#111827",
    fontSize: rs(11),
    fontWeight: "600",
    marginTop: rs(5),
    maxWidth: rs(72),
    textAlign: "center",
  },
  addHint: { color: '#6B7280', fontSize: rs(9), marginTop: rs(2), textAlign: 'center' },
  feedback: { color: "#6A00FF", textAlign: "center", marginTop: rs(8) },
  previewRow: { paddingHorizontal: rs(12), paddingTop: rs(12), gap: rs(8), flexDirection: 'row', flexWrap: 'wrap' },
  preview: {
    width: '31%',
    height: rs(112),
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
  previewViews: { flexDirection: 'row', alignItems: 'center', gap: rs(3), marginTop: rs(4) },
  previewViewsText: { color: '#FFFFFF', fontSize: rs(10), fontWeight: '700' },
  addButton: { flexDirection: "row", alignItems: "center", gap: 3 },
  addText: { color: "#6A00FF", fontWeight: "700" },
  viewer: { flex: 1, alignItems: "center", justifyContent: "center" },
  media: { width: "100%", height: "100%" },
  topShade: { position: 'absolute', top: 0, left: 0, right: 0, height: '25%', zIndex: 1 },
  bottomShade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', zIndex: 1 },
  viewCount: { position: 'absolute', bottom: rs(36), left: rs(22), flexDirection: 'row', alignItems: 'center', gap: rs(7), zIndex: 3 },
  viewCountText: { color: '#FFFFFF', fontSize: rs(14), fontWeight: '700' },
  viewersSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '48%', backgroundColor: '#FFFFFF', borderTopLeftRadius: rs(22), borderTopRightRadius: rs(22), paddingHorizontal: rs(20), paddingTop: rs(18), zIndex: 8 },
  viewersHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rs(12) },
  viewersTitle: { color: '#111827', fontSize: rs(18), fontWeight: '800' },
  viewerRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12), paddingVertical: rs(8) },
  viewerAvatar: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  viewerName: { color: '#111827', fontSize: rs(14), fontWeight: '600' },
  emptyViewers: { color: '#6B7280', textAlign: 'center', marginTop: rs(30) },
  caption: { position: 'absolute', bottom: rs(80), left: rs(20), right: rs(20), color: '#FFFFFF', fontSize: rs(16), textAlign: 'center', zIndex: 3, padding: rs(10), textShadowColor: '#000000', textShadowRadius: 8 },
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
    paddingBottom: rs(25),
  },
  audienceChoices: { flexDirection: 'row', gap: rs(10), marginTop: rs(10) },
  audienceChoice: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: rs(6), borderWidth: 1, borderColor: '#D1D5DB', borderRadius: rs(12), padding: rs(10), minHeight: rs(72) },
  audienceSelected: { borderColor: '#6A00FF', backgroundColor: '#F5F3FF' },
  darkAudienceSelected: { backgroundColor: '#2E1065' },
  audienceText: { color: '#111827', fontSize: rs(11), fontWeight: '700', flexShrink: 1 },
  audienceCopy: { flex: 1 },
  audienceDescription: { color: '#6B7280', fontSize: rs(9), marginTop: rs(3), lineHeight: rs(12) },
  darkChoice: { backgroundColor: '#27272A', borderColor: '#52525B' },
  darkInput: { backgroundColor: '#27272A', color: '#FFFFFF' },
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
  typeChoices: { flexDirection: 'row', backgroundColor: '#EDE9FE', borderRadius: rs(14), padding: rs(4), marginTop: rs(20) },
  typeChoice: { flex: 1, alignItems: 'center', paddingVertical: rs(11), borderRadius: rs(11) },
  typeSelected: { backgroundColor: '#6A00FF' },
  typeSelectedText: { color: '#FFFFFF' },
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
  captionInput: { color: '#111827', backgroundColor: '#F3F4F6', borderRadius: rs(12), paddingHorizontal: rs(14), marginTop: rs(12) },
  mediaPreview: { width: "100%", height: rs(130) },
  field: { color: "#111827", fontWeight: "800", marginTop: rs(18) },
  color: { width: rs(30), height: rs(30), borderRadius: rs(15) },
  colorSelected: { borderWidth: 3, borderColor: "#111827" },
  postDisabled: {
    backgroundColor: "transparent",
    borderRadius: rs(14),
    overflow: 'hidden',
  },
  postGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: rs(14) },
  postFooter: { marginTop: 0, marginHorizontal: rs(18), marginBottom: rs(25) },
  postText: { color: "#FFFFFF", fontWeight: "800", fontSize: rs(15) },
  notice: { color: "#6B7280", marginTop: rs(10), lineHeight: rs(18) },
});
