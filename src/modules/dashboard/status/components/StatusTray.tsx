import React from "react";
import {
  AccessibilityInfo, ActionSheetIOS, ActivityIndicator, Alert, Animated, AppState, Easing, Image,
  Keyboard, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, View, type ViewStyle,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Video, { type VideoRef } from "react-native-video";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { launchImageLibrary, type Asset } from "react-native-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { normalizeLocalCmsImageUrl } from "../../../../config/apiConfig";
import { rs } from "../../../../utils/responsive";
import type {
  StatusAudienceCompany, StatusAudiencePerson, StatusComment, StatusFeedGroup, StatusLike,
  StatusType, StatusViewer, StatusVisibility, UserStatus,
} from "../types";
import {
  addStatusComment, createStatus, deleteStatus, deleteStatusComment, fetchStatusAudienceOptions,
  fetchStatusComments, fetchStatusLikes, fetchStatusViewers, sameStatusId, toggleStatusLike,
} from "../api/statusApi";

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

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens and helpers
// ─────────────────────────────────────────────────────────────────────────────

const BRAND = {
  royal: "#4B0082",
  violet: "#6A00FF",
  pink: "#FF2D7A",
  gold: "#FFC83D",
  orange: "#FF8A00",
  heart: "#FF3B6B",
} as const;

const RING_UNSEEN = ["#7A2CFF", "#C13BD8", BRAND.pink];
const RING_OWN = [BRAND.royal, BRAND.violet];
const RING_SEEN = ["#D4D4D8", "#D4D4D8"];
const RING_SEEN_DARK = ["#52525B", "#52525B"];
const TEXT_BACKGROUNDS = [BRAND.royal, BRAND.violet, BRAND.pink, BRAND.orange, BRAND.gold, "#111827"];
const DEFAULT_SECONDS = 5;
const DEFAULT_VIDEO_SECONDS = 15;

const textColorOn = (background?: string | null) =>
  [BRAND.gold, BRAND.orange].includes((background || "").toUpperCase() as typeof BRAND.gold) ? "#18181B" : "#FFFFFF";

const statusFontStyle = (font?: string | null) => ({
  fontStyle: font === "italic" ? ("italic" as const) : ("normal" as const),
  fontWeight: font === "bold" ? ("800" as const) : ("600" as const),
});

const NAIVE_TIMESTAMP = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

/** Parses a server timestamp; strings without a zone are read as device-local. */
const parseServerTime = (value?: string | null) =>
  value ? new Date(value.trim().replace(" ", "T")).getTime() : NaN;

/**
 * Latest instant a server timestamp could denote. A string without a zone
 * ("2026-10-14 10:30:00") is ambiguous between device-local and UTC, so take
 * the later reading. Expiry then never fires early because of a timezone
 * mismatch; the server already drops expired statuses from /feed and /mine.
 */
const latestServerInstant = (value?: string | null) => {
  const local = parseServerTime(value);
  if (!value || !NAIVE_TIMESTAMP.test(value.trim())) return local;
  const utc = new Date(`${value.trim().replace(" ", "T")}Z`).getTime();
  return Math.max(local, utc);
};

const EXPIRY_GRACE_MS = 60_000;
const isExpired = (status: UserStatus) => {
  const expires = latestServerInstant(status.expires_at);
  return Number.isFinite(expires) && expires + EXPIRY_GRACE_MS < Date.now();
};

const timeAgo = (value?: string | null) => {
  const time = parseServerTime(value);
  if (!Number.isFinite(time)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
};

const getCompany = (status: UserStatus, ownCompany?: string | null) => {
  const user = status.user as typeof status.user & { company?: { name?: string } | string; company_name?: string };
  return (typeof user.company === "string" ? user.company : user.company?.name) || user.company_name || ownCompany || "";
};

const firstName = (name?: string | null) => name?.trim().split(/\s+/)[0] || "";
const mediaUri = (url?: string | null) => normalizeLocalCmsImageUrl(url) || url || undefined;
const errorMessage = (error: any, fallback = "Please try again.") =>
  error?.response?.data?.message || error?.message || fallback;
const isNetworkError = (error: any) =>
  !error?.response && (error?.code === "ERR_NETWORK" || /network/i.test(error?.message ?? ""));

/** Platform-appropriate soft shadow: iOS shadow props, Android elevation. */
const softShadow = (elevation: number, opacity = 0.08): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#1E0B3A",
      shadowOpacity: opacity,
      shadowRadius: elevation * 2,
      shadowOffset: { width: 0, height: Math.ceil(elevation / 2) },
    },
    default: { elevation },
  })!;

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value); }).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => { mounted = false; subscription.remove(); };
  }, []);
  return reduced;
}

const Avatar = React.memo(function Avatar({ uri, size, dark = false }: { uri?: string | null; size: number; dark?: boolean }) {
  const normalized = normalizeLocalCmsImageUrl(uri);
  return (
    <View style={[shared.avatar, { width: size, height: size, borderRadius: size / 2 }, dark && shared.avatarDark]}>
      {normalized
        ? <Image source={{ uri: normalized }} style={{ width: size, height: size }} accessible={false} />
        : <MaterialCommunityIcons name="account" size={size * 0.62} color={dark ? "#A1A1AA" : "#9CA3AF"} />}
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Tray
// ─────────────────────────────────────────────────────────────────────────────

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
  const { isDark } = useAppTheme();
  const reducedMotion = useReducedMotion();
  // The open status is tracked by ID so a feed refresh (every 15s on the
  // dashboard) can never swap the viewer to a different status.
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [overrides, setOverrides] = React.useState<Record<number, Partial<UserStatus>>>({});
  const [hiddenIds, setHiddenIds] = React.useState<number[]>([]);
  // Viewing marks groups as seen, which re-sorts them; keep the order stable
  // while the viewer is open.
  const [frozenOrder, setFrozenOrder] = React.useState<number[] | null>(null);
  const requestCloseRef = React.useRef<() => void>(() => undefined);

  // Ownership comes from /status/mine (is_own), falling back to the auth user
  // ID compared numerically. Display names are never used.
  const ownGroupFromApi = groups.find(group => group.is_own);
  const ownUserId = ownGroupFromApi?.user.id ?? currentUserId;
  const isOwnGroup = React.useCallback(
    (group: StatusFeedGroup) => !!group.is_own || sameStatusId(group.user.id, ownUserId),
    [ownUserId],
  );

  React.useEffect(() => {
    if (__DEV__ && ownGroupFromApi && currentUserId != null && !sameStatusId(ownGroupFromApi.user.id, currentUserId)) {
      console.warn(
        `[STATUS] Auth user_id (${String(currentUserId)}) differs from the status API user id `
        + `(${String(ownGroupFromApi.user.id)}). Ownership uses /status/mine.`,
      );
    }
  }, [ownGroupFromApi, currentUserId]);

  const visibleGroups = React.useMemo(() => groups.flatMap(group => {
    const statuses = group.statuses
      .filter(status => !hiddenIds.includes(status.id) && !isExpired(status))
      .map(status => overrides[status.id] ? { ...status, ...overrides[status.id] } : status);
    return statuses.length ? [{ ...group, statuses }] : [];
  }), [groups, hiddenIds, overrides]);

  const mine = React.useMemo<StatusFeedGroup | undefined>(() => {
    const own = visibleGroups.filter(isOwnGroup);
    if (!own.length) return undefined;
    // Merge and de-duplicate in case the feed also returned our statuses.
    const byId = new Map<string, UserStatus>();
    own.forEach(group => group.statuses.forEach(status => byId.set(String(status.id), status)));
    return { ...own[0], has_unviewed: false, is_own: true, statuses: [...byId.values()] };
  }, [visibleGroups, isOwnGroup]);

  const ordered = React.useMemo(() => {
    const others = profileMode ? [] : visibleGroups.filter(group => !isOwnGroup(group));
    let sorted: StatusFeedGroup[];
    if (frozenOrder) {
      const rank = (group: StatusFeedGroup) => {
        const index = frozenOrder.findIndex(id => sameStatusId(id, group.user.id));
        return index < 0 ? Number.MAX_SAFE_INTEGER : index;
      };
      sorted = [...others].sort((a, b) => rank(a) - rank(b));
    } else {
      // Unviewed updates first, keeping the server's order within each block.
      sorted = [
        ...others.filter(group => group.statuses.some(status => !status.viewed)),
        ...others.filter(group => group.statuses.every(status => status.viewed)),
      ];
    }
    return mine ? [mine, ...sorted] : sorted;
  }, [visibleGroups, mine, isOwnGroup, profileMode, frozenOrder]);

  const position = React.useMemo(() => {
    if (selectedId == null) return null;
    for (let group = 0; group < ordered.length; group++) {
      const status = ordered[group].statuses.findIndex(item => sameStatusId(item.id, selectedId));
      if (status >= 0) return { group, status };
    }
    return null;
  }, [ordered, selectedId]);

  const isMine = React.useCallback((status: UserStatus) =>
    (!!mine && mine.statuses.some(item => sameStatusId(item.id, status.id))) || sameStatusId(status.user?.id, ownUserId),
  [mine, ownUserId]);

  const open = React.useCallback((statusId: number) => {
    const item = ordered.flatMap(group => group.statuses).find(status => sameStatusId(status.id, statusId));
    if (!item) return;
    const own = isMine(item);
    if (__DEV__) {
      console.log("[STATUS] open", {
        statusId: item.id, own, statusUserId: item.user?.id, authUserId: currentUserId, ownUserId,
        created_at: item.created_at, expires_at: item.expires_at,
        deviceNow: new Date().toISOString(), deviceUtcOffsetMin: -new Date().getTimezoneOffset(),
      });
    }
    setFrozenOrder(current => current ?? ordered.map(group => group.user.id));
    setSelectedId(item.id);
    if (!item.viewed && !own) onViewed(item.id);
  }, [ordered, isMine, onViewed, currentUserId, ownUserId]);

  const close = React.useCallback(() => {
    setSelectedId(null);
    setFrozenOrder(null);
    // Pull fresh counts if anything changed while viewing.
    if (Object.keys(overrides).length) onRetry();
  }, [overrides, onRetry]);

  // Drop local overrides once fresh server data arrives after the viewer closes.
  React.useEffect(() => {
    if (selectedId == null) setOverrides({});
  }, [groups]); // eslint-disable-line react-hooks/exhaustive-deps

  // A deleted status stays hidden until the refreshed feed no longer has it.
  React.useEffect(() => {
    setHiddenIds(ids => ids.filter(id => groups.some(group => group.statuses.some(status => status.id === id))));
  }, [groups]);

  // Close if the open status disappears (deleted elsewhere or expired).
  React.useEffect(() => {
    if (selectedId != null && !position) close();
  }, [selectedId, position, close]);

  const recordInteraction = React.useCallback((statusId: number, patch: Partial<UserStatus>) => {
    setOverrides(current => ({ ...current, [statusId]: { ...current[statusId], ...patch } }));
  }, []);

  const handleDeleted = React.useCallback((statusId: number) => {
    setHiddenIds(ids => [...ids, statusId]);
    onDeleted(statusId);
  }, [onDeleted]);

  const openGroup = (group: StatusFeedGroup) => {
    const target = group.statuses.find(item => !item.viewed) ?? group.statuses[0];
    if (target) open(target.id);
    // Refresh own counts in the background when opening My Status.
    if (group === mine) onRetry();
  };

  const labelColor = headerMode ? headerTextColor || (isDark ? "#F8FAFC" : "#111827") : undefined;
  const others = mine ? ordered.slice(1) : ordered;

  return (
    <View style={[tray.section, isDark && tray.sectionDark, headerMode && tray.headerSection]}>
      {profileMode && (
        <View style={tray.head}>
          <Text style={[tray.title, isDark && tray.textDark]} accessibilityRole="header">Status</Text>
          <Pressable onPress={() => setCreating(true)} style={tray.addButton} accessibilityRole="button" hitSlop={8}>
            <MaterialCommunityIcons name="plus" size={rs(16)} color={BRAND.violet} />
            <Text style={tray.addText}>Add Status</Text>
          </Pressable>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tray.row}>
        <StoryItem
          imageUri={currentUserImage || mine?.user.image_url}
          label="Your Status"
          ring={mine ? "own" : "empty"}
          showAdd
          isDark={isDark}
          labelColor={labelColor}
          onPress={() => (mine ? openGroup(mine) : setCreating(true))}
          onAdd={() => setCreating(true)}
          accessibilityLabel={mine ? "View your status" : "Add a status"}
        />

        {others.map(group => {
          const unseen = group.statuses.some(status => !status.viewed);
          return (
            <StoryItem
              key={String(group.user.id)}
              imageUri={group.user.image_url}
              label={firstName(group.user.name) || "User"}
              ring={unseen ? "unseen" : "seen"}
              isDark={isDark}
              labelColor={labelColor}
              onPress={() => openGroup(group)}
              accessibilityLabel={`${group.user.name || "User"}'s status${unseen ? ", new" : ""}`}
            />
          );
        })}

        {loading && !groups.length && [0, 1, 2, 3].map(key => (
          <SkeletonItem key={key} isDark={isDark} reducedMotion={reducedMotion} />
        ))}

        {error && (
          <Pressable onPress={onRetry} style={tray.retry} accessibilityRole="button" accessibilityLabel="Couldn't load updates. Retry">
            <View style={[tray.retryCircle, isDark && tray.retryCircleDark]}>
              <MaterialCommunityIcons name="refresh" size={rs(22)} color={BRAND.violet} />
            </View>
            <Text style={[tray.retryText, labelColor ? { color: labelColor } : isDark && tray.textDark]} numberOfLines={1}>Retry</Text>
          </Pressable>
        )}
      </ScrollView>

      {profileMode && mine && (
        <View style={tray.grid}>
          {mine.statuses.map(item => (
            <Pressable
              key={item.id}
              onPress={() => open(item.id)}
              style={({ pressed }) => [tray.tile, { backgroundColor: item.background_color || BRAND.royal }, pressed && tray.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Open your ${item.type === "image" ? "photo" : item.type} status`}
            >
              {item.type === "image" && item.media_url ? (
                <Image source={{ uri: mediaUri(item.media_url) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : item.type === "video" ? (
                <View style={tray.tileCenter}>
                  <MaterialCommunityIcons name="play-circle-outline" size={rs(28)} color="#FFFFFF" />
                </View>
              ) : (
                <Text style={[tray.tileText, { color: textColorOn(item.background_color) }]} numberOfLines={4}>
                  {item.text || "Text status"}
                </Text>
              )}
              <View style={tray.tileViews}>
                <MaterialCommunityIcons name="eye-outline" size={rs(12)} color="#FFFFFF" />
                <Text style={tray.tileViewsText}>{Number(item.view_count ?? 0)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <Modal visible={!!position} animationType="fade" statusBarTranslucent onRequestClose={() => requestCloseRef.current()}>
        {position && (
          <StatusViewerScreen
            groups={ordered}
            position={position}
            isMine={isMine}
            ownUserId={ownUserId}
            currentUserImage={currentUserImage}
            currentCompanyName={currentCompanyName}
            reducedMotion={reducedMotion}
            onOpen={open}
            onClose={close}
            onDeleted={handleDeleted}
            onInteraction={recordInteraction}
            requestCloseRef={requestCloseRef}
          />
        )}
      </Modal>

      <StatusComposer visible={creating} isDark={isDark} onClose={() => setCreating(false)} onCreated={onCreated} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Carousel items
// ─────────────────────────────────────────────────────────────────────────────

const RING = rs(58);
const RING_WIDTH = rs(2.25);
const RING_GAP = rs(2);

const StoryItem = React.memo(function StoryItem({
  imageUri, label, ring, showAdd, isDark, labelColor, onPress, onAdd, accessibilityLabel,
}: {
  imageUri?: string | null;
  label: string;
  ring: "own" | "unseen" | "seen" | "empty";
  showAdd?: boolean;
  isDark: boolean;
  labelColor?: string;
  onPress: () => void;
  onAdd?: () => void;
  accessibilityLabel: string;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const pressTo = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: value === 1 ? 6 : 0 }).start();
  const surface = isDark ? "#101014" : "#FFFFFF";
  const colors = ring === "own" ? RING_OWN : ring === "unseen" ? RING_UNSEEN : isDark ? RING_SEEN_DARK : RING_SEEN;

  return (
    <View style={tray.item}>
      <Pressable
        onPress={onPress}
        onPressIn={() => pressTo(0.94)}
        onPressOut={() => pressTo(1)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={tray.itemPress}
      >
        <Animated.View style={[tray.ring, ring === "empty" && [tray.emptyRing, isDark && tray.emptyRingDark], { transform: [{ scale }] }]}>
          {ring !== "empty" && (
            // Gradients stay childless: LinearGradient 2.8.x is a legacy interop
            // view on Fabric, and children inside it crash on unmount.
            <LinearGradient colors={colors} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          )}
          <View style={[tray.ringGap, { backgroundColor: surface }]}>
            <Avatar uri={imageUri} size={RING - (RING_WIDTH + RING_GAP) * 2} dark={isDark} />
          </View>
        </Animated.View>
        <Text numberOfLines={1} style={[tray.label, isDark && tray.labelDark, labelColor ? { color: labelColor } : null]}>
          {label}
        </Text>
      </Pressable>
      {showAdd && (
        // A sibling of the circle's Pressable, so tapping + never opens the status.
        <Pressable
          onPress={onAdd}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Create a new status"
          style={[tray.addBadge, { borderColor: surface }]}
        >
          <MaterialCommunityIcons name="plus" size={rs(13)} color="#FFFFFF" />
        </Pressable>
      )}
    </View>
  );
});

function SkeletonItem({ isDark, reducedMotion }: { isDark: boolean; reducedMotion: boolean }) {
  const pulse = React.useRef(new Animated.Value(0.55)).current;
  React.useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.55, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse, reducedMotion]);
  const fill = isDark ? "#27272A" : "#ECE8F4";
  return (
    <Animated.View style={[tray.item, { opacity: pulse }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[tray.skeletonCircle, { backgroundColor: fill }]} />
      <View style={[tray.skeletonLabel, { backgroundColor: fill }]} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Full-screen viewer
// ─────────────────────────────────────────────────────────────────────────────

type ActivityTab = "views" | "likes" | "comments";

function StatusViewerScreen({
  groups, position, isMine, ownUserId, currentUserImage, currentCompanyName,
  reducedMotion, onOpen, onClose, onDeleted, onInteraction, requestCloseRef,
}: {
  groups: StatusFeedGroup[];
  position: { group: number; status: number };
  isMine: (status: UserStatus) => boolean;
  ownUserId: number | null;
  currentUserImage?: string | null;
  currentCompanyName?: string | null;
  reducedMotion: boolean;
  onOpen: (statusId: number) => void;
  onClose: () => void;
  onDeleted: (statusId: number) => void;
  onInteraction: (statusId: number, patch: Partial<UserStatus>) => void;
  requestCloseRef: React.MutableRefObject<() => void>;
}) {
  const insets = useSafeAreaInsets();
  const group = groups[position.group];
  const active = group?.statuses[position.status];
  const activeId = active?.id;
  const own = !!active && isMine(active);
  const expired = !!active && isExpired(active);

  // Pause reasons; progress and playback only run when none apply.
  const [holding, setHolding] = React.useState(false);
  const [appActive, setAppActive] = React.useState(AppState.currentState === "active");
  const [sheet, setSheet] = React.useState<ActivityTab | null>(null);
  const [replyFocused, setReplyFocused] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [sendingReply, setSendingReply] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [mediaLoading, setMediaLoading] = React.useState(false);
  const [mediaFailed, setMediaFailed] = React.useState(false);
  const [buffering, setBuffering] = React.useState(false);

  const [liked, setLiked] = React.useState(false);
  const [liking, setLiking] = React.useState(false);
  const [counts, setCounts] = React.useState({ views: 0, likes: 0, comments: 0 });
  const [toast, setToast] = React.useState("");
  const [restartKey, setRestartKey] = React.useState(0);

  const replyInFlight = React.useRef(false);
  const activeIdRef = React.useRef(activeId);
  activeIdRef.current = activeId;
  const videoRef = React.useRef<VideoRef>(null);
  const videoDuration = React.useRef(0);

  const hasMedia = !!active?.media_url && !expired;
  const playsVideo = active?.type === "video" && hasMedia && !mediaFailed;
  // Shared by the progress timer and the video player.
  const interrupted = holding || !appActive || !!sheet || replyFocused || !!replyText.trim()
    || sendingReply || deleting || menuOpen;

  React.useEffect(() => {
    setReplyText("");
    setReplyFocused(false);
    setSheet(null);
    setLiked(!!active?.liked);
    setCounts({
      views: Number(active?.view_count ?? 0),
      likes: Number(active?.like_count ?? 0),
      comments: Number(active?.comment_count ?? 0),
    });
    setMediaFailed(false);
    setBuffering(false);
    videoDuration.current = Number(active?.duration_seconds) || 0;
    setMediaLoading((active?.type === "image" || active?.type === "video") && !!active.media_url && !(active && isExpired(active)));
    Keyboard.dismiss();
    // Reset only when the visible status changes, not on feed refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", state => setAppActive(state === "active"));
    return () => subscription.remove();
  }, []);

  // ── Navigation ──
  const move = React.useCallback((direction: 1 | -1) => {
    if (replyInFlight.current) return;
    let groupIndex = position.group;
    let statusIndex = position.status + direction;
    if (statusIndex >= (groups[groupIndex]?.statuses.length ?? 0)) {
      groupIndex += 1;
      statusIndex = 0;
    } else if (statusIndex < 0) {
      if (groupIndex === 0) {
        // First status: replay it, like Stories.
        setRestartKey(key => key + 1);
        videoRef.current?.seek(0);
        return;
      }
      groupIndex -= 1;
      statusIndex = (groups[groupIndex]?.statuses.length ?? 1) - 1;
    }
    const next = groups[groupIndex]?.statuses[statusIndex];
    if (next) onOpen(next.id);
    else onClose();
  }, [groups, position, onOpen, onClose]);
  const moveRef = React.useRef(move);
  moveRef.current = move;

  // ── Progress ──
  // Timed statuses use a native-driver animation; elapsed time is tracked in
  // JS so pauses resume where they stopped. Videos drive progress themselves.
  const progress = React.useRef(new Animated.Value(0)).current;
  const elapsed = React.useRef(0);
  const seconds = active?.duration_seconds && active.duration_seconds > 0
    ? active.duration_seconds
    : active?.type === "video" ? DEFAULT_VIDEO_SECONDS : DEFAULT_SECONDS;

  React.useEffect(() => {
    elapsed.current = 0;
    progress.setValue(0);
  }, [activeId, restartKey, progress]);

  React.useEffect(() => {
    if (!activeId || playsVideo || interrupted || mediaLoading) return;
    const total = seconds * 1000;
    const startFraction = elapsed.current;
    const startedAt = Date.now();
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: Math.max(80, (1 - startFraction) * total),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => { if (finished) moveRef.current(1); });
    return () => {
      animation.stop();
      elapsed.current = Math.min(1, startFraction + (Date.now() - startedAt) / total);
    };
  }, [activeId, restartKey, playsVideo, interrupted, mediaLoading, seconds, progress]);

  // ── Transitions ──
  const enter = React.useRef(new Animated.Value(1)).current;
  const chrome = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    if (reducedMotion) return;
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [activeId, enter, reducedMotion]);
  React.useEffect(() => {
    // Hide the UI while the user holds to read, like native Stories.
    Animated.timing(chrome, { toValue: holding ? 0 : 1, duration: 180, useNativeDriver: true }).start();
  }, [holding, chrome]);

  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  const showToast = React.useCallback((message: string) => {
    setToast(message);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) setToast(""); });
  }, [toastOpacity]);

  const heart = React.useRef(new Animated.Value(1)).current;

  // ── Actions ──
  const toggleLike = async () => {
    if (!active || own || liking) return;
    const statusId = active.id;
    const before = { liked, likes: counts.likes };
    const next = !liked;
    setLiked(next);
    setCounts(value => ({ ...value, likes: Math.max(0, value.likes + (next ? 1 : -1)) }));
    if (next && !reducedMotion) {
      heart.setValue(0.6);
      Animated.spring(heart, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 14 }).start();
    }
    setLiking(true);
    try {
      const result = await toggleStatusLike(statusId);
      onInteraction(statusId, { liked: result.liked, like_count: result.like_count });
      if (activeIdRef.current === statusId) {
        setLiked(result.liked);
        setCounts(value => ({ ...value, likes: result.like_count }));
      }
    } catch {
      if (activeIdRef.current === statusId) {
        setLiked(before.liked);
        setCounts(value => ({ ...value, likes: before.likes }));
        showToast("Couldn't update like");
      }
    } finally {
      setLiking(false);
    }
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!active || own || !text || replyInFlight.current) return;
    const statusId = active.id;
    replyInFlight.current = true;
    setSendingReply(true);
    try {
      await addStatusComment(statusId, text);
      onInteraction(statusId, { comment_count: Number(active.comment_count ?? 0) + 1 });
      if (activeIdRef.current !== statusId) return;
      setCounts(value => ({ ...value, comments: value.comments + 1 }));
      setReplyText("");
      setReplyFocused(false);
      Keyboard.dismiss();
      showToast("Reply sent");
    } catch (error) {
      if (activeIdRef.current === statusId) {
        setMenuOpen(true);
        Alert.alert("Couldn't send reply", errorMessage(error), [
          { text: "OK", onPress: () => setMenuOpen(false) },
        ], { onDismiss: () => setMenuOpen(false) });
      }
    } finally {
      replyInFlight.current = false;
      setSendingReply(false);
    }
  };

  const confirmDelete = () => {
    if (!active || !own || deleting) return;
    const statusId = active.id;
    // After deleting, continue with the remaining own statuses, or close.
    const nextStatus = group.statuses[position.status + 1] ?? group.statuses[position.status - 1];
    setMenuOpen(true);
    Alert.alert("Delete status?", "It will be removed for everyone right away.", [
      { text: "Cancel", style: "cancel", onPress: () => setMenuOpen(false) },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setMenuOpen(false);
          setDeleting(true);
          try {
            await deleteStatus(statusId);
            onDeleted(statusId);
            if (nextStatus) onOpen(nextStatus.id);
            else onClose();
          } catch (error) {
            Alert.alert("Couldn't delete status", errorMessage(error));
          } finally {
            setDeleting(false);
          }
        },
      },
    ], { cancelable: true, onDismiss: () => setMenuOpen(false) });
  };

  const showOwnerMenu = () => {
    if (!own) return;
    setMenuOpen(true);
    const handle = (choice: "activity" | "delete" | "cancel") => {
      if (choice === "activity") { setMenuOpen(false); setSheet("views"); }
      else if (choice === "delete") confirmDelete();
      else setMenuOpen(false);
    };
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["View activity", "Delete status", "Cancel"], destructiveButtonIndex: 1, cancelButtonIndex: 2 },
        index => handle(index === 0 ? "activity" : index === 1 ? "delete" : "cancel"),
      );
    } else {
      Alert.alert("Status options", undefined, [
        { text: "View activity", onPress: () => handle("activity") },
        { text: "Delete status", style: "destructive", onPress: () => handle("delete") },
        { text: "Cancel", style: "cancel", onPress: () => handle("cancel") },
      ], { cancelable: true, onDismiss: () => handle("cancel") });
    }
  };

  const openVideoExternally = () => {
    const url = mediaUri(active?.media_url);
    if (url) Linking.openURL(url).catch(() => showToast("Couldn't open this video"));
  };

  requestCloseRef.current = () => (sheet ? setSheet(null) : onClose());

  const onCountsChange = React.useCallback((patch: Partial<typeof counts>) => {
    setCounts(value => ({ ...value, ...patch }));
  }, []);

  if (!active || !group) return null;

  const background = active.type === "text" ? active.background_color || BRAND.royal : "#0B0A10";
  const company = getCompany(active, own ? currentCompanyName : null);
  const contentStyle = reducedMotion ? null : {
    opacity: enter,
    transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.975, 1] }) }],
  };
  const chromeStyle = { opacity: chrome };
  const barBottom = insets.bottom + rs(10);

  return (
    <View style={[viewer.root, { backgroundColor: background }]}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[StyleSheet.absoluteFill, viewer.stage, contentStyle]} pointerEvents="box-none">
        {expired ? (
          <Notice icon="clock-alert-outline" title="This status has expired" hint="Tap to continue to the next update." />
        ) : active.type === "image" && hasMedia && !mediaFailed ? (
          <>
            <Image
              source={{ uri: mediaUri(active.media_url) }}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
              onLoadEnd={() => setMediaLoading(false)}
              onError={() => { setMediaFailed(true); setMediaLoading(false); }}
              accessibilityLabel={active.text || "Photo status"}
            />
            {mediaLoading && <ActivityIndicator color="#FFFFFF" size="large" />}
          </>
        ) : active.type === "image" ? (
          <Notice icon="image-broken-variant" title="Couldn't load this photo" hint="Check your connection and try again." />
        ) : playsVideo ? (
          <>
            <Video
              key={active.id}
              ref={videoRef}
              source={{ uri: mediaUri(active.media_url)! }}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
              paused={interrupted}
              repeat={false}
              playInBackground={false}
              playWhenInactive={false}
              progressUpdateInterval={100}
              onLoad={data => {
                videoDuration.current = Number(data.duration) || videoDuration.current || DEFAULT_VIDEO_SECONDS;
                setMediaLoading(false);
              }}
              onBuffer={({ isBuffering }) => setBuffering(isBuffering)}
              onProgress={data => {
                if (videoDuration.current > 0) progress.setValue(Math.min(1, data.currentTime / videoDuration.current));
              }}
              onEnd={() => moveRef.current(1)}
              onError={() => { setMediaFailed(true); setMediaLoading(false); setBuffering(false); }}
              accessibilityLabel={active.text || "Video status"}
            />
            {(mediaLoading || buffering) && <ActivityIndicator color="#FFFFFF" size="large" />}
          </>
        ) : active.type === "video" ? (
          <Pressable onPress={openVideoExternally} style={viewer.videoCard} accessibilityRole="button" accessibilityLabel="Open video in player">
            <View style={viewer.playCircle}>
              <MaterialCommunityIcons name="video-off-outline" size={rs(32)} color="#FFFFFF" />
            </View>
            <Text style={viewer.noticeTitle}>Couldn't play this video</Text>
            <Text style={viewer.noticeHint}>Tap to open it in your video player</Text>
          </Pressable>
        ) : (
          <Text
            style={[viewer.statusText, { color: textColorOn(active.background_color) }, statusFontStyle(active.font_style)]}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            numberOfLines={12}
          >
            {active.text}
          </Text>
        )}
      </Animated.View>

      {active.type !== "text" && (
        <>
          <LinearGradient pointerEvents="none" colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0)"]} style={viewer.topShade} />
          <LinearGradient pointerEvents="none" colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]} style={viewer.bottomShade} />
        </>
      )}

      {/* Tap zones: left third = back, right = next, hold = pause. Disabled while typing. */}
      <View
        style={[viewer.tapArea, { top: insets.top + rs(72), bottom: barBottom + rs(70) }]}
        pointerEvents={sheet || replyFocused ? "none" : "box-none"}
      >
        {([-1, 1] as const).map(direction => (
          <Pressable
            key={direction}
            style={direction === -1 ? viewer.tapBack : viewer.tapNext}
            delayLongPress={200}
            onLongPress={() => setHolding(true)}
            onPressOut={() => setHolding(false)}
            onPress={() => move(direction)}
            accessibilityRole="button"
            accessibilityLabel={direction === 1 ? "Next status" : "Previous status"}
          />
        ))}
      </View>

      {active.type !== "text" && !!active.text && !expired && (
        <Animated.View pointerEvents="none" style={[viewer.captionWrap, { bottom: barBottom + rs(80) }, chromeStyle]}>
          <Text style={viewer.caption}>{active.text}</Text>
        </Animated.View>
      )}

      {/* Header */}
      <Animated.View style={[viewer.header, { top: insets.top + rs(8) }, chromeStyle]} pointerEvents={holding ? "none" : "box-none"}>
        <View style={viewer.segments}>
          {group.statuses.map((item, index) => (
            <View key={item.id} style={viewer.segmentTrack}>
              <Animated.View
                style={[viewer.segmentFill, {
                  transform: [{ scaleX: index < position.status ? 1 : index > position.status ? 0 : progress }],
                }]}
              />
            </View>
          ))}
        </View>
        <View style={viewer.identity}>
          <View style={viewer.identityAvatar}>
            <Avatar uri={own ? currentUserImage || active.user.image_url : active.user.image_url} size={rs(34)} />
          </View>
          <View style={viewer.identityCopy}>
            <Text style={viewer.name} numberOfLines={1}>
              {own ? "My status" : active.user.name || "User"}
              <Text style={viewer.time}>{"  "}{timeAgo(active.created_at)}</Text>
            </Text>
            {!!company && <Text style={viewer.company} numberOfLines={1}>{company}</Text>}
          </View>
          {own && (
            <Pressable
              onPress={showOwnerMenu}
              disabled={deleting}
              hitSlop={6}
              style={viewer.glassButton}
              accessibilityRole="button"
              accessibilityLabel="Status options"
            >
              {deleting
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <MaterialCommunityIcons name="dots-horizontal" size={rs(24)} color="#FFFFFF" />}
            </Pressable>
          )}
          <Pressable onPress={onClose} hitSlop={6} style={viewer.glassButton} accessibilityRole="button" accessibilityLabel="Close status">
            <MaterialCommunityIcons name="close" size={rs(23)} color="#FFFFFF" />
          </Pressable>
        </View>
      </Animated.View>

      {/* Bottom bar */}
      <KeyboardAvoidingView style={viewer.bottomLayer} behavior={Platform.OS === "ios" ? "padding" : undefined} pointerEvents="box-none">
        <Animated.View style={[{ paddingBottom: replyFocused ? rs(10) : barBottom }, chromeStyle]} pointerEvents={holding ? "none" : "box-none"}>
          {own ? (
            <View style={viewer.metrics}>
              {([
                { key: "views", icon: "eye-outline", label: "Views", value: counts.views },
                { key: "likes", icon: "heart-outline", label: "Likes", value: counts.likes },
                { key: "comments", icon: "comment-text-outline", label: "Replies", value: counts.comments },
              ] as const).map((metric, index) => (
                <React.Fragment key={metric.key}>
                  {index > 0 && <View style={viewer.metricDivider} />}
                  <Pressable
                    onPress={() => setSheet(metric.key)}
                    style={({ pressed }) => [viewer.metric, pressed && viewer.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`${metric.value} ${metric.label}. Show details`}
                  >
                    <MaterialCommunityIcons name={metric.icon} size={rs(19)} color="#FFFFFF" />
                    <Text style={viewer.metricValue}>{metric.value}</Text>
                    <Text style={viewer.metricLabel}>{metric.label}</Text>
                  </Pressable>
                </React.Fragment>
              ))}
            </View>
          ) : (
            <View style={viewer.replyRow}>
              <View style={viewer.replyPill}>
                <TextInput
                  value={replyText}
                  onChangeText={setReplyText}
                  placeholder={`Reply to ${firstName(active.user.name) || "status"}…`}
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  maxLength={1000}
                  editable={!sendingReply && !expired}
                  returnKeyType="send"
                  onFocus={() => setReplyFocused(true)}
                  onBlur={() => setReplyFocused(false)}
                  onSubmitEditing={sendReply}
                  style={viewer.replyInput}
                  accessibilityLabel="Reply to status"
                />
                {!!replyText.trim() && (
                  <Pressable onPress={sendReply} disabled={sendingReply} style={viewer.send} accessibilityRole="button" accessibilityLabel="Send reply">
                    {sendingReply
                      ? <ActivityIndicator color="#FFFFFF" size="small" />
                      : <MaterialCommunityIcons name="arrow-up" size={rs(20)} color="#FFFFFF" />}
                  </Pressable>
                )}
              </View>
              {!replyFocused && (
                <>
                  <Pressable
                    onPress={toggleLike}
                    disabled={liking || expired}
                    hitSlop={6}
                    style={viewer.iconButton}
                    accessibilityRole="button"
                    accessibilityState={{ selected: liked }}
                    accessibilityLabel={liked ? "Unlike status" : "Like status"}
                  >
                    <Animated.View style={{ transform: [{ scale: heart }] }}>
                      <MaterialCommunityIcons name={liked ? "heart" : "heart-outline"} size={rs(28)} color={liked ? BRAND.heart : "#FFFFFF"} />
                    </Animated.View>
                  </Pressable>
                  <Pressable
                    onPress={() => setSheet("comments")}
                    hitSlop={6}
                    style={viewer.iconButton}
                    accessibilityRole="button"
                    accessibilityLabel="Show replies"
                  >
                    <MaterialCommunityIcons name="comment-text-outline" size={rs(25)} color="#FFFFFF" />
                  </Pressable>
                </>
              )}
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>

      {!!toast && (
        <Animated.View pointerEvents="none" style={[viewer.toast, { top: insets.top + rs(84), opacity: toastOpacity }]}>
          <MaterialCommunityIcons name="check-circle" size={rs(16)} color="#FFFFFF" />
          <Text style={viewer.toastText}>{toast}</Text>
        </Animated.View>
      )}

      {sheet && (
        <ActivitySheet
          statusId={active.id}
          initialTab={own ? sheet : "comments"}
          tabs={own ? ["views", "likes", "comments"] : ["comments"]}
          ownStatus={own}
          ownUserId={ownUserId}
          counts={counts}
          bottomInset={insets.bottom}
          onCountsChange={onCountsChange}
          onCommentDeleted={() => onInteraction(active.id, { comment_count: Math.max(0, counts.comments - 1) })}
          onClose={() => setSheet(null)}
        />
      )}
    </View>
  );
}

function Notice({ icon, title, hint }: { icon: string; title: string; hint: string }) {
  return (
    <View style={viewer.notice}>
      <View style={viewer.playCircle}>
        <MaterialCommunityIcons name={icon} size={rs(32)} color="#FFFFFF" />
      </View>
      <Text style={viewer.noticeTitle}>{title}</Text>
      <Text style={viewer.noticeHint}>{hint}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity sheet: views, likes and replies
// ─────────────────────────────────────────────────────────────────────────────

type ListState<T> = { items: T[]; loading: boolean; error: string; next: number | null; loaded: boolean };
const emptyList = <T,>(): ListState<T> => ({ items: [], loading: false, error: "", next: null, loaded: false });

const TAB_META: Record<ActivityTab, { icon: string; label: string; empty: string }> = {
  views: { icon: "eye-outline", label: "Views", empty: "No views yet" },
  likes: { icon: "heart-outline", label: "Likes", empty: "No likes yet" },
  comments: { icon: "comment-text-outline", label: "Replies", empty: "No replies yet" },
};

function ActivitySheet({
  statusId, initialTab, tabs, ownStatus, ownUserId, counts, bottomInset, onCountsChange, onCommentDeleted, onClose,
}: {
  statusId: number;
  initialTab: ActivityTab;
  tabs: ActivityTab[];
  ownStatus: boolean;
  ownUserId: number | null;
  counts: { views: number; likes: number; comments: number };
  bottomInset: number;
  onCountsChange: (counts: Partial<{ views: number; likes: number; comments: number }>) => void;
  onCommentDeleted: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = React.useState<ActivityTab>(initialTab);
  const [views, setViews] = React.useState<ListState<StatusViewer>>(emptyList);
  const [likes, setLikes] = React.useState<ListState<StatusLike>>(emptyList);
  const [comments, setComments] = React.useState<ListState<StatusComment>>(emptyList);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const inFlight = React.useRef<Record<ActivityTab, boolean>>({ views: false, likes: false, comments: false });
  const mounted = React.useRef(true);
  const slide = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    mounted.current = true;
    Animated.spring(slide, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 3 }).start();
    return () => { mounted.current = false; };
  }, [slide]);

  const load = React.useCallback(async (which: ActivityTab, append = false) => {
    if (inFlight.current[which]) return;
    inFlight.current[which] = true;
    const setter = (which === "views" ? setViews : which === "likes" ? setLikes : setComments) as
      React.Dispatch<React.SetStateAction<ListState<any>>>;
    setter(state => ({ ...state, loading: true, error: "" }));
    try {
      if (which === "views") {
        const result = await fetchStatusViewers(statusId);
        if (!mounted.current) return;
        setViews({ items: result.viewers, loading: false, error: "", next: null, loaded: true });
        onCountsChange({ views: result.viewCount });
      } else if (which === "likes") {
        const result = await fetchStatusLikes(statusId, append ? likes.next : null);
        if (!mounted.current) return;
        setLikes(state => {
          const seen = new Set(append ? state.items.map(item => item.user.id) : []);
          const items = append ? [...state.items, ...result.likes.filter(item => !seen.has(item.user.id))] : result.likes;
          return { items, loading: false, error: "", next: result.nextBeforeUserId, loaded: true };
        });
        onCountsChange({ likes: result.likeCount });
      } else {
        const result = await fetchStatusComments(statusId, append ? comments.next : null);
        if (!mounted.current) return;
        setComments(state => {
          const seen = new Set(append ? state.items.map(item => item.id) : []);
          const items = append ? [...state.items, ...result.comments.filter(item => !seen.has(item.id))] : result.comments;
          return { items, loading: false, error: "", next: result.nextBeforeId, loaded: true };
        });
      }
    } catch (error) {
      if (mounted.current) setter(state => ({ ...state, loading: false, error: errorMessage(error) }));
    } finally {
      inFlight.current[which] = false;
    }
  }, [statusId, likes.next, comments.next, onCountsChange]);

  const current = tab === "views" ? views : tab === "likes" ? likes : comments;
  React.useEffect(() => {
    if (!current.loaded && !current.loading && !current.error) void load(tab);
  }, [tab, current.loaded, current.loading, current.error, load]);

  // The status owner can moderate replies; anyone can remove their own.
  const canDelete = (comment: StatusComment) => ownStatus || sameStatusId(comment.user?.id, ownUserId);

  const confirmDeleteComment = (comment: StatusComment) => {
    if (deletingId != null) return;
    Alert.alert("Delete reply?", "This reply will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingId(comment.id);
          try {
            await deleteStatusComment(statusId, comment.id);
            if (!mounted.current) return;
            setComments(state => ({ ...state, items: state.items.filter(item => item.id !== comment.id) }));
            onCountsChange({ comments: Math.max(0, counts.comments - 1) });
            onCommentDeleted();
          } catch (error) {
            Alert.alert("Couldn't delete reply", errorMessage(error));
          } finally {
            if (mounted.current) setDeletingId(null);
          }
        },
      },
    ]);
  };

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [rs(420), 0] });

  const renderBody = () => {
    if (current.error) {
      return (
        <Pressable onPress={() => void load(tab)} style={sheetStyles.empty} accessibilityRole="button">
          <View style={[sheetStyles.emptyIcon, sheetStyles.errorIcon]}>
            <MaterialCommunityIcons name="wifi-off" size={rs(24)} color="#DC2626" />
          </View>
          <Text style={sheetStyles.emptyText}>{current.error}</Text>
          <Text style={sheetStyles.retry}>Tap to retry</Text>
        </Pressable>
      );
    }
    if (!current.loaded) return <ActivityIndicator style={sheetStyles.spinner} color={BRAND.violet} />;
    if (!current.items.length) {
      return (
        <View style={sheetStyles.empty}>
          <View style={sheetStyles.emptyIcon}>
            <MaterialCommunityIcons name={TAB_META[tab].icon} size={rs(26)} color={BRAND.violet} />
          </View>
          <Text style={sheetStyles.emptyText}>{TAB_META[tab].empty}</Text>
        </View>
      );
    }
    if (tab === "views") {
      return views.items.map(item => (
        <ActivityRow key={item.user_id} uri={item.image_url} name={item.name} meta={timeAgo(item.viewed_at)} icon="eye-check-outline" />
      ));
    }
    if (tab === "likes") {
      return (
        <>
          {likes.items.map(item => (
            <ActivityRow
              key={item.user.id}
              uri={item.user.image_url}
              name={item.user.name}
              meta={timeAgo(item.liked_at || item.created_at)}
              icon="heart"
              iconColor={BRAND.heart}
            />
          ))}
          {likes.next != null && <LoadMore loading={likes.loading} label="Load more likes" onPress={() => void load("likes", true)} />}
        </>
      );
    }
    return (
      <>
        {comments.items.map(item => (
          <ActivityRow key={item.id} uri={item.user.image_url} name={item.user.name} meta={timeAgo(item.created_at)} body={item.text}>
            {canDelete(item) ? (
              <Pressable
                onPress={() => confirmDeleteComment(item)}
                disabled={deletingId != null}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Delete reply from ${item.user.name || "user"}`}
              >
                {deletingId === item.id
                  ? <ActivityIndicator size="small" color={BRAND.violet} />
                  : <MaterialCommunityIcons name="trash-can-outline" size={rs(19)} color="#A1A1AA" />}
              </Pressable>
            ) : null}
          </ActivityRow>
        ))}
        {comments.next != null && <LoadMore loading={comments.loading} label="Load more replies" onPress={() => void load("comments", true)} />}
      </>
    );
  };

  return (
    <View style={sheetStyles.layer}>
      <Animated.View style={[sheetStyles.backdrop, { opacity: slide }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close activity" />
      </Animated.View>
      <Animated.View style={[sheetStyles.sheet, { paddingBottom: bottomInset + rs(12), transform: [{ translateY }] }]}>
        <View style={sheetStyles.handle} />
        <View style={sheetStyles.heading}>
          <Text style={sheetStyles.title} accessibilityRole="header">{tabs.length > 1 ? "Activity" : "Replies"}</Text>
          <Pressable onPress={onClose} style={sheetStyles.close} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
            <MaterialCommunityIcons name="close" size={rs(18)} color="#52525B" />
          </Pressable>
        </View>
        {tabs.length > 1 && (
          <View style={sheetStyles.tabs} accessibilityRole="tablist">
            {tabs.map(key => {
              const selected = tab === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setTab(key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  style={[sheetStyles.tab, selected && sheetStyles.tabActive]}
                >
                  <MaterialCommunityIcons name={TAB_META[key].icon} size={rs(16)} color={selected ? BRAND.violet : "#71717A"} />
                  <Text style={[sheetStyles.tabLabel, selected && sheetStyles.tabLabelActive]}>
                    {TAB_META[key].label} {counts[key]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <ScrollView style={sheetStyles.scroll} contentContainerStyle={sheetStyles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderBody()}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function ActivityRow({ uri, name, meta, body, icon, iconColor = "#A1A1AA", children }: {
  uri?: string | null;
  name?: string | null;
  meta?: string;
  body?: string;
  icon?: string;
  iconColor?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={sheetStyles.row}>
      <Avatar uri={uri} size={rs(42)} />
      <View style={sheetStyles.rowCopy}>
        <Text style={sheetStyles.rowName} numberOfLines={1}>{name || "User"}</Text>
        {!!body && <Text style={sheetStyles.rowBody}>{body}</Text>}
        {!!meta && <Text style={sheetStyles.rowMeta}>{meta}</Text>}
      </View>
      {children ?? (icon ? <MaterialCommunityIcons name={icon} size={rs(18)} color={iconColor} /> : null)}
    </View>
  );
}

function LoadMore({ loading, label, onPress }: { loading: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={sheetStyles.loadMore} accessibilityRole="button">
      {loading ? <ActivityIndicator color={BRAND.violet} /> : <Text style={sheetStyles.loadMoreText}>{label}</Text>}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composer
// ─────────────────────────────────────────────────────────────────────────────

const TYPES: Array<{ value: StatusType; label: string; icon: string }> = [
  { value: "text", label: "Text", icon: "format-text" },
  { value: "image", label: "Photo", icon: "image-outline" },
  { value: "video", label: "Video", icon: "video-outline" },
];

const AUDIENCES: Array<{ value: StatusVisibility; label: string; description: string; icon: string }> = [
  { value: "same_company", label: "My company", description: "Colleagues at your company", icon: "domain" },
  { value: "all_companies", label: "All companies", description: "Everyone on Reward Planners", icon: "earth" },
  { value: "all_except_companies", label: "All except…", description: "Hide from companies you choose", icon: "domain-remove" },
  { value: "custom_people", label: "Only share with…", description: "People you choose", icon: "account-multiple-check-outline" },
];

const FONTS = [
  { value: "default", label: "Regular" },
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
];

const formatDuration = (seconds?: number) => {
  if (!seconds) return "";
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};
const formatSize = (bytes?: number) =>
  !bytes ? "" : bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

type Phase = "editing" | "uploading" | "success";

function StatusComposer({ visible, isDark, onClose, onCreated }: {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
  onCreated: (status: UserStatus) => void;
}) {
  const insets = useSafeAreaInsets();
  const [type, setType] = React.useState<StatusType>("text");
  const [draft, setDraft] = React.useState("");
  const [media, setMedia] = React.useState<Asset | null>(null);
  const [color, setColor] = React.useState<string>(BRAND.royal);
  const [font, setFont] = React.useState("default");
  const [visibility, setVisibility] = React.useState<StatusVisibility | null>(null);
  const [excludedCompanyIds, setExcludedCompanyIds] = React.useState<number[]>([]);
  const [allowedUserIds, setAllowedUserIds] = React.useState<number[]>([]);
  const [phase, setPhase] = React.useState<Phase>("editing");
  const [uploaded, setUploaded] = React.useState(0);
  const [error, setError] = React.useState("");
  const successScale = React.useRef(new Animated.Value(0)).current;
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  const c = isDark ? composerDark : composerLight;
  const busy = phase !== "editing";
  const hasContent = type === "text" ? !!draft.trim() : !!media?.uri;
  const audienceReady = !!visibility
    && (visibility !== "all_except_companies" || excludedCompanyIds.length > 0)
    && (visibility !== "custom_people" || allowedUserIds.length > 0);
  const canShare = hasContent && audienceReady && !busy;

  const reset = () => {
    setType("text");
    setDraft("");
    setMedia(null);
    setColor(BRAND.royal);
    setFont("default");
    setVisibility(null);
    setExcludedCompanyIds([]);
    setAllowedUserIds([]);
    setPhase("editing");
    setUploaded(0);
    setError("");
  };

  const requestClose = () => {
    if (busy) return; // An upload in progress can't be cancelled safely.
    if (!draft.trim() && !media) {
      reset();
      onClose();
      return;
    }
    Alert.alert("Discard status?", "Your draft will be lost.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => { reset(); onClose(); } },
    ]);
  };

  const chooseType = (next: StatusType) => {
    if (busy || next === type) return;
    setType(next);
    setMedia(null);
    setError("");
  };

  const pickMedia = async () => {
    if (busy || type === "text") return;
    const result = await launchImageLibrary({ mediaType: type === "image" ? "photo" : "video", selectionLimit: 1 });
    if (result.didCancel) return;
    if (result.errorCode === "permission") {
      Alert.alert("Allow photo access", "Reward Planners needs access to your photos to share a status.", [
        { text: "Not now", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    if (result.errorCode) {
      Alert.alert("Couldn't open your gallery", result.errorMessage || "Please try again.");
      return;
    }
    if (result.assets?.[0]?.uri) {
      setMedia(result.assets[0]);
      setError("");
    }
  };

  const share = async () => {
    if (busy) return;
    if (!hasContent) {
      setError(type === "text" ? "Write something to share." : `Choose a ${type === "image" ? "photo" : "video"} to share.`);
      return;
    }
    if (!visibility) {
      setError("Choose who can see this status.");
      return;
    }
    if (visibility === "all_except_companies" && !excludedCompanyIds.length) {
      setError("Choose at least one company to hide this from.");
      return;
    }
    if (visibility === "custom_people" && !allowedUserIds.length) {
      setError("Choose at least one person to share with.");
      return;
    }
    setError("");
    setUploaded(0);
    setPhase("uploading");
    try {
      const status = await createStatus({
        type,
        text: draft.trim() || undefined,
        visibility,
        excludedCompanyIds: visibility === "all_except_companies" ? excludedCompanyIds : [],
        allowedUserIds: visibility === "custom_people" ? allowedUserIds : [],
        background_color: type === "text" ? color : undefined,
        font_style: type === "text" ? font : undefined,
        media: type !== "text" && media?.uri ? {
          uri: media.uri,
          type: media.type || (type === "image" ? "image/jpeg" : "video/mp4"),
          fileName: media.fileName || `status-${Date.now()}.${type === "image" ? "jpg" : "mp4"}`,
        } : undefined,
        onUploadProgress: type === "text" ? undefined : setUploaded,
      });
      onCreated(status);
      setPhase("success");
      successScale.setValue(0.4);
      Animated.spring(successScale, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 12 }).start();
      closeTimer.current = setTimeout(() => { reset(); onClose(); }, 750);
    } catch (shareError) {
      setPhase("editing");
      setError(isNetworkError(shareError)
        ? "You're offline. Check your connection and try again."
        : errorMessage(shareError, "Couldn't share your status. Please try again."));
    }
  };

  // iOS presents a native page sheet, so the screen's top inset doesn't apply.
  const topPadding = Platform.OS === "ios" ? rs(14) : insets.top + rs(8);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : undefined}
      statusBarTranslucent={Platform.OS === "android"}
      onRequestClose={requestClose}
    >
      <KeyboardAvoidingView style={[composer.root, { backgroundColor: c.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[composer.navBar, { paddingTop: topPadding, borderBottomColor: c.separator }]}>
          <View style={composer.navRow}>
            <Pressable onPress={requestClose} disabled={busy} hitSlop={10} style={composer.navSide} accessibilityRole="button">
              <Text style={[composer.navCancel, busy && composer.disabledText]}>Cancel</Text>
            </Pressable>
            <Text style={[composer.navTitle, { color: c.text }]} accessibilityRole="header">New Status</Text>
            <View style={composer.navSide} />
          </View>
        </View>

        <ScrollView contentContainerStyle={composer.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[composer.segmented, { backgroundColor: c.fill }]} accessibilityRole="tablist">
            {TYPES.map(item => {
              const selected = type === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => chooseType(item.value)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected, disabled: busy }}
                  style={[composer.segment, selected && [composer.segmentActive, { backgroundColor: c.card }]]}
                >
                  <MaterialCommunityIcons name={item.icon} size={rs(17)} color={selected ? BRAND.violet : c.muted} />
                  <Text style={[composer.segmentLabel, { color: selected ? c.text : c.muted }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {type === "text" ? (
            <View style={[composer.preview, composer.textPreview, { backgroundColor: color }]}>
              <TextInput
                multiline
                value={draft}
                onChangeText={setDraft}
                editable={!busy}
                placeholder="What's on your mind?"
                placeholderTextColor={textColorOn(color) === "#FFFFFF" ? "rgba(255,255,255,0.65)" : "rgba(24,24,27,0.5)"}
                style={[composer.textInput, { color: textColorOn(color) }, statusFontStyle(font)]}
                accessibilityLabel="Status text"
              />
            </View>
          ) : media?.uri ? (
            <View style={[composer.preview, { backgroundColor: "#0B0A10" }]}>
              {type === "image" ? (
                <Image source={{ uri: media.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel="Selected photo" />
              ) : (
                <Video
                  source={{ uri: media.uri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                  paused={busy}
                  repeat
                  muted
                  playInBackground={false}
                  accessibilityLabel="Selected video"
                />
              )}
              {type === "video" && (
                <View style={composer.videoBadge} pointerEvents="none">
                  <MaterialCommunityIcons name="video" size={rs(14)} color="#FFFFFF" />
                  <Text style={composer.chipText}>{[formatDuration(media.duration), formatSize(media.fileSize)].filter(Boolean).join("  ·  ") || "Video"}</Text>
                </View>
              )}
              {!busy && (
                <View style={composer.previewActions}>
                  <Pressable onPress={() => setMedia(null)} style={composer.chip} accessibilityRole="button" accessibilityLabel="Remove media">
                    <MaterialCommunityIcons name="close" size={rs(16)} color="#FFFFFF" />
                  </Pressable>
                  <Pressable onPress={pickMedia} style={composer.chip} accessibilityRole="button" accessibilityLabel="Choose different media">
                    <MaterialCommunityIcons name="swap-horizontal" size={rs(16)} color="#FFFFFF" />
                    <Text style={composer.chipText}>Change</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            <Pressable
              onPress={pickMedia}
              style={({ pressed }) => [composer.preview, composer.pickPreview, { backgroundColor: c.card, borderColor: c.dashed }, pressed && composer.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Choose a ${type === "image" ? "photo" : "video"} from your gallery`}
            >
              <View style={[composer.pickIcon, { backgroundColor: c.accentFill }]}>
                <MaterialCommunityIcons name={type === "image" ? "image-plus" : "video-plus"} size={rs(30)} color={BRAND.violet} />
              </View>
              <Text style={[composer.pickTitle, { color: c.text }]}>Choose a {type === "image" ? "photo" : "video"}</Text>
              <Text style={[composer.pickHint, { color: c.muted }]}>From your gallery</Text>
            </Pressable>
          )}

          {type === "text" ? (
            <>
              <View style={composer.swatches}>
                {TEXT_BACKGROUNDS.map(item => (
                  <Pressable
                    key={item}
                    onPress={() => setColor(item)}
                    disabled={busy}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: color === item }}
                    accessibilityLabel={`Background ${item}`}
                    style={[composer.swatchRing, color === item && { borderColor: item }]}
                  >
                    <View style={[composer.swatch, { backgroundColor: item }]} />
                  </Pressable>
                ))}
              </View>
              <View style={composer.fontRow}>
                {FONTS.map(item => {
                  const selected = font === item.value;
                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => setFont(item.value)}
                      disabled={busy}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      style={[composer.fontChip, { backgroundColor: selected ? c.accentFill : c.fill }]}
                    >
                      <Text style={[composer.fontChipText, statusFontStyle(item.value), { color: selected ? BRAND.violet : c.text }]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <TextInput
              value={draft}
              onChangeText={setDraft}
              editable={!busy}
              placeholder="Add a caption…"
              placeholderTextColor={c.muted}
              multiline
              style={[composer.caption, { backgroundColor: c.card, color: c.text, borderColor: c.separator }]}
              accessibilityLabel="Caption"
            />
          )}

          <Text style={[composer.sectionLabel, { color: c.muted }]}>WHO CAN SEE THIS</Text>
          <View style={[composer.group, { backgroundColor: c.card }]}>
            {AUDIENCES.map((item, index) => {
              const selected = visibility === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => { setVisibility(item.value); setError(""); }}
                  disabled={busy}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [composer.option, pressed && { backgroundColor: c.fill }]}
                >
                  <View style={[composer.optionIcon, { backgroundColor: c.accentFill }]}>
                    <MaterialCommunityIcons name={item.icon} size={rs(18)} color={BRAND.violet} />
                  </View>
                  <View style={[composer.optionCopy, index > 0 && { borderTopColor: c.separator, borderTopWidth: StyleSheet.hairlineWidth }]}>
                    <View style={composer.optionText}>
                      <Text style={[composer.optionLabel, { color: c.text }]}>{item.label}</Text>
                      <Text style={[composer.optionDescription, { color: c.muted }]}>{item.description}</Text>
                    </View>
                    <MaterialCommunityIcons
                      name={selected ? "check-circle" : "checkbox-blank-circle-outline"}
                      size={rs(22)}
                      color={selected ? BRAND.violet : c.dashed}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>

          {(visibility === "all_except_companies" || visibility === "custom_people") && (
            <AudiencePicker
              mode={visibility === "all_except_companies" ? "companies" : "people"}
              selected={visibility === "all_except_companies" ? excludedCompanyIds : allowedUserIds}
              onToggle={id => {
                const setter = visibility === "all_except_companies" ? setExcludedCompanyIds : setAllowedUserIds;
                setter(ids => (ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]));
                setError("");
              }}
              disabled={busy}
              colors={c}
            />
          )}

          {!!error && (
            <View style={composer.errorBanner} accessibilityLiveRegion="polite">
              <MaterialCommunityIcons name="alert-circle-outline" size={rs(18)} color="#DC2626" />
              <Text style={composer.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[composer.footer, { paddingBottom: insets.bottom + rs(12), borderTopColor: c.separator, backgroundColor: c.background }]}>
          <Pressable
            onPress={share}
            disabled={busy}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canShare, busy }}
            accessibilityLabel={phase === "uploading" ? `Sharing, ${Math.round(uploaded * 100)} percent` : "Share status"}
            style={({ pressed }) => [composer.shareButton, !canShare && phase === "editing" && composer.shareDisabled, pressed && composer.pressed]}
          >
            <LinearGradient
              colors={phase === "success" ? ["#16A34A", "#22C55E"] : [BRAND.royal, BRAND.violet]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {phase === "uploading" && type !== "text" && (
              <View style={[composer.progressFill, { width: `${Math.round(uploaded * 100)}%` }]} />
            )}
            {phase === "success" ? (
              <Animated.View style={[composer.shareContent, { transform: [{ scale: successScale }] }]}>
                <MaterialCommunityIcons name="check" size={rs(20)} color="#FFFFFF" />
                <Text style={composer.shareText}>Shared</Text>
              </Animated.View>
            ) : phase === "uploading" ? (
              <View style={composer.shareContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={composer.shareText}>
                  {type === "text" || uploaded <= 0 ? "Sharing…" : uploaded >= 1 ? "Processing…" : `Uploading ${Math.round(uploaded * 100)}%`}
                </Text>
              </View>
            ) : (
              <View style={composer.shareContent}>
                <Text style={composer.shareText}>Share Status</Text>
                <MaterialCommunityIcons name="arrow-up" size={rs(18)} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AudiencePicker({ mode, selected, onToggle, disabled, colors: c }: {
  mode: "companies" | "people";
  selected: number[];
  onToggle: (id: number) => void;
  disabled: boolean;
  colors: typeof composerLight;
}) {
  const [companies, setCompanies] = React.useState<StatusAudienceCompany[]>([]);
  const [people, setPeople] = React.useState<StatusAudiencePerson[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchStatusAudienceOptions();
      setCompanies(result.companies);
      setPeople(result.people);
      setLoaded(true);
    } catch (loadError) {
      setError(errorMessage(loadError, "Couldn't load the list."));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { if (!loaded && !loading && !error) void load(); }, [loaded, loading, error, load]);

  const query = search.trim().toLowerCase();
  const items = mode === "companies"
    ? companies.filter(item => item.name.toLowerCase().includes(query)).map(item => ({ id: item.id, title: item.name, subtitle: "", image: item.logo_url }))
    : people
      .filter(item => `${item.name} ${item.company?.name ?? ""}`.toLowerCase().includes(query))
      .map(item => ({ id: item.id, title: item.name, subtitle: item.company?.name ?? "", image: item.image_url }));

  return (
    <View style={[composer.picker, { backgroundColor: c.card }]}>
      <Text style={[composer.pickerTitle, { color: c.text }]}>
        {mode === "companies" ? "Hide from" : "Share with"} · {selected.length} selected
      </Text>
      <View style={[composer.search, { backgroundColor: c.fill }]}>
        <MaterialCommunityIcons name="magnify" size={rs(18)} color={c.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={mode === "companies" ? "Search companies" : "Search people"}
          placeholderTextColor={c.muted}
          style={[composer.searchInput, { color: c.text }]}
          autoCorrect={false}
        />
      </View>
      {loading ? (
        <ActivityIndicator color={BRAND.violet} style={composer.pickerSpinner} />
      ) : error ? (
        <Pressable onPress={() => void load()} style={composer.pickerError} accessibilityRole="button">
          <Text style={composer.errorText}>{error}</Text>
          <Text style={composer.pickerRetry}>Retry</Text>
        </Pressable>
      ) : (
        <ScrollView style={composer.pickerList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {items.length ? items.map(item => {
            const checked = selected.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => onToggle(item.id)}
                disabled={disabled}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                style={[composer.pickerRow, { borderBottomColor: c.separator }]}
              >
                <Avatar uri={item.image} size={rs(34)} />
                <View style={composer.optionText}>
                  <Text style={[composer.pickerName, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
                  {!!item.subtitle && <Text style={[composer.optionDescription, { color: c.muted }]} numberOfLines={1}>{item.subtitle}</Text>}
                </View>
                <MaterialCommunityIcons
                  name={checked ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                  size={rs(22)}
                  color={checked ? BRAND.violet : c.dashed}
                />
              </Pressable>
            );
          }) : (
            <Text style={[composer.pickerEmpty, { color: c.muted }]}>{query ? "No matches" : "Nothing to show"}</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const shared = StyleSheet.create({
  avatar: { backgroundColor: "#F1EEF8", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarDark: { backgroundColor: "#27272A" },
});

const tray = StyleSheet.create({
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: rs(20),
    marginHorizontal: rs(12),
    marginTop: rs(12),
    paddingVertical: rs(12),
    ...softShadow(4, 0.06),
  },
  sectionDark: { backgroundColor: "#18181B" },
  headerSection: {
    backgroundColor: "transparent",
    borderRadius: 0,
    marginHorizontal: 0,
    marginTop: 0,
    paddingVertical: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  head: { paddingHorizontal: rs(16), marginBottom: rs(12), flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: "#18181B", fontSize: rs(17), lineHeight: rs(22), fontWeight: "700", letterSpacing: -0.3 },
  textDark: { color: "#F4F4F5" },
  addButton: { flexDirection: "row", alignItems: "center", gap: rs(3), minHeight: rs(32) },
  addText: { color: BRAND.violet, fontSize: rs(14), fontWeight: "600" },
  row: { paddingHorizontal: rs(12), paddingVertical: rs(2), gap: rs(8) },
  item: { width: rs(66), alignItems: "center" },
  itemPress: { alignItems: "center" },
  ring: { width: RING, height: RING, borderRadius: RING / 2, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  emptyRing: { borderWidth: 1.5, borderColor: "#DDD5EE", borderStyle: "dashed" },
  emptyRingDark: { borderColor: "#3F3F46" },
  ringGap: {
    width: RING - RING_WIDTH * 2,
    height: RING - RING_WIDTH * 2,
    borderRadius: (RING - RING_WIDTH * 2) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  addBadge: {
    position: "absolute",
    top: RING - rs(20),
    left: rs(66) / 2 + RING / 2 - rs(20),
    width: rs(22),
    height: rs(22),
    borderRadius: rs(11),
    borderWidth: rs(2),
    backgroundColor: BRAND.violet,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: rs(5),
    maxWidth: rs(64),
    color: "#27272A",
    fontSize: rs(11),
    lineHeight: rs(14),
    fontWeight: "500",
    textAlign: "center",
  },
  labelDark: { color: "#E4E4E7" },
  skeletonCircle: { width: RING, height: RING, borderRadius: RING / 2 },
  skeletonLabel: { width: rs(40), height: rs(8), borderRadius: rs(4), marginTop: rs(8) },
  retry: { width: rs(66), alignItems: "center" },
  retryCircle: { width: RING, height: RING, borderRadius: RING / 2, backgroundColor: "#F1EAFE", alignItems: "center", justifyContent: "center" },
  retryCircleDark: { backgroundColor: "#2A1A4A" },
  retryText: { marginTop: rs(5), color: "#27272A", fontSize: rs(11), lineHeight: rs(14), fontWeight: "500" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: rs(8), paddingHorizontal: rs(12), paddingTop: rs(14) },
  tile: { width: "31.5%", aspectRatio: 9 / 14, borderRadius: rs(14), overflow: "hidden", padding: rs(8), justifyContent: "center" },
  tileCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  tileText: { fontSize: rs(12), lineHeight: rs(16), fontWeight: "600", textAlign: "center" },
  tileViews: {
    position: "absolute", left: rs(6), bottom: rs(6), flexDirection: "row", alignItems: "center", gap: rs(3),
    paddingHorizontal: rs(6), paddingVertical: rs(2), borderRadius: rs(8), backgroundColor: "rgba(0,0,0,0.4)",
  },
  tileViewsText: { color: "#FFFFFF", fontSize: rs(10.5), fontWeight: "700" },
  pressed: { opacity: 0.85 },
});

const viewer = StyleSheet.create({
  root: { flex: 1 },
  stage: { alignItems: "center", justifyContent: "center" },
  statusText: { fontSize: rs(30), lineHeight: rs(39), letterSpacing: -0.4, textAlign: "center", paddingHorizontal: rs(28), maxWidth: "100%" },
  topShade: { position: "absolute", top: 0, left: 0, right: 0, height: "26%" },
  bottomShade: { position: "absolute", bottom: 0, left: 0, right: 0, height: "32%" },
  tapArea: { position: "absolute", left: 0, right: 0, flexDirection: "row" },
  tapBack: { flex: 1 },
  tapNext: { flex: 2 },
  header: { position: "absolute", left: rs(10), right: rs(10) },
  segments: { flexDirection: "row", gap: rs(4), height: rs(2.5) },
  segmentTrack: { flex: 1, borderRadius: rs(2), backgroundColor: "rgba(255,255,255,0.32)", overflow: "hidden" },
  segmentFill: { flex: 1, backgroundColor: "#FFFFFF", transformOrigin: "left" },
  identity: { flexDirection: "row", alignItems: "center", gap: rs(8), marginTop: rs(12), paddingLeft: rs(2) },
  identityAvatar: { borderRadius: rs(19), borderWidth: 1.5, borderColor: "rgba(255,255,255,0.85)" },
  identityCopy: { flex: 1 },
  name: { color: "#FFFFFF", fontSize: rs(14.5), lineHeight: rs(19), fontWeight: "700", letterSpacing: -0.2 },
  time: { color: "rgba(255,255,255,0.72)", fontWeight: "500" },
  company: { color: "rgba(255,255,255,0.78)", fontSize: rs(12), lineHeight: rs(16) },
  glassButton: { width: rs(40), height: rs(40), borderRadius: rs(20), backgroundColor: "rgba(0,0,0,0.22)", alignItems: "center", justifyContent: "center" },
  captionWrap: { position: "absolute", left: rs(24), right: rs(24), alignItems: "center" },
  caption: {
    color: "#FFFFFF", fontSize: rs(16), lineHeight: rs(22), fontWeight: "500", textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 6,
  },
  notice: { alignItems: "center", gap: rs(8), paddingHorizontal: rs(32) },
  videoCard: { alignItems: "center", gap: rs(8), padding: rs(24), zIndex: 3 },
  playCircle: {
    width: rs(76), height: rs(76), borderRadius: rs(38), borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center", marginBottom: rs(6),
  },
  noticeTitle: { color: "#FFFFFF", fontSize: rs(18), lineHeight: rs(23), fontWeight: "700", textAlign: "center" },
  noticeHint: { color: "rgba(255,255,255,0.72)", fontSize: rs(13.5), lineHeight: rs(19), textAlign: "center" },
  bottomLayer: { position: "absolute", left: 0, right: 0, bottom: 0 },
  metrics: {
    marginHorizontal: rs(16), flexDirection: "row", alignItems: "center", borderRadius: rs(22),
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.28)", backgroundColor: "rgba(20,16,32,0.62)", paddingVertical: rs(6),
  },
  metric: { flex: 1, minHeight: rs(54), alignItems: "center", justifyContent: "center", borderRadius: rs(16) },
  pressed: { backgroundColor: "rgba(255,255,255,0.08)" },
  metricValue: { color: "#FFFFFF", fontSize: rs(15), lineHeight: rs(19), fontWeight: "700", marginTop: rs(2) },
  metricLabel: { color: "rgba(255,255,255,0.7)", fontSize: rs(11), lineHeight: rs(14), fontWeight: "500" },
  metricDivider: { width: StyleSheet.hairlineWidth, height: rs(30), backgroundColor: "rgba(255,255,255,0.25)" },
  replyRow: { marginHorizontal: rs(14), flexDirection: "row", alignItems: "center", gap: rs(6) },
  replyPill: {
    flex: 1, minHeight: rs(46), flexDirection: "row", alignItems: "center", borderRadius: rs(23), borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)", backgroundColor: "rgba(0,0,0,0.28)", paddingLeft: rs(16), paddingRight: rs(4),
  },
  replyInput: { flex: 1, color: "#FFFFFF", fontSize: rs(15), paddingVertical: rs(10) },
  send: { width: rs(36), height: rs(36), borderRadius: rs(18), backgroundColor: BRAND.violet, alignItems: "center", justifyContent: "center" },
  iconButton: { width: rs(44), height: rs(46), alignItems: "center", justifyContent: "center" },
  toast: {
    position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: rs(6),
    paddingHorizontal: rs(14), paddingVertical: rs(8), borderRadius: rs(18), backgroundColor: "rgba(20,16,32,0.82)",
  },
  toastText: { color: "#FFFFFF", fontSize: rs(13), fontWeight: "600" },
});

const sheetStyles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end", zIndex: 20 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(9,7,15,0.5)" },
  sheet: {
    minHeight: "45%", maxHeight: "78%", backgroundColor: "#FBFAFE", borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24),
    paddingTop: rs(8), paddingHorizontal: rs(16),
  },
  handle: { alignSelf: "center", width: rs(36), height: rs(5), borderRadius: rs(3), backgroundColor: "#D4D4D8", marginBottom: rs(12) },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: rs(14) },
  title: { color: "#18181B", fontSize: rs(20), lineHeight: rs(25), fontWeight: "700", letterSpacing: -0.3 },
  close: { width: rs(32), height: rs(32), borderRadius: rs(16), backgroundColor: "#EFEDF4", alignItems: "center", justifyContent: "center" },
  tabs: { flexDirection: "row", padding: rs(3), borderRadius: rs(12), backgroundColor: "#EFEDF4", marginBottom: rs(8) },
  tab: { flex: 1, minHeight: rs(38), flexDirection: "row", alignItems: "center", justifyContent: "center", gap: rs(5), borderRadius: rs(9) },
  tabActive: { backgroundColor: "#FFFFFF", ...softShadow(1, 0.08) },
  tabLabel: { color: "#71717A", fontSize: rs(12), fontWeight: "600" },
  tabLabelActive: { color: BRAND.violet },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: rs(16) },
  spinner: { marginVertical: rs(48) },
  row: { flexDirection: "row", alignItems: "center", gap: rs(12), paddingVertical: rs(12), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E9E6F0" },
  rowCopy: { flex: 1, gap: rs(2) },
  rowName: { color: "#18181B", fontSize: rs(14.5), lineHeight: rs(19), fontWeight: "600" },
  rowBody: { color: "#3F3F46", fontSize: rs(14), lineHeight: rs(19) },
  rowMeta: { color: "#8E8E93", fontSize: rs(12), lineHeight: rs(16) },
  empty: { alignItems: "center", paddingVertical: rs(40), gap: rs(8) },
  emptyIcon: { width: rs(56), height: rs(56), borderRadius: rs(28), backgroundColor: "#F1EAFE", alignItems: "center", justifyContent: "center" },
  errorIcon: { backgroundColor: "#FEE2E2" },
  emptyText: { color: "#71717A", fontSize: rs(14), lineHeight: rs(19), textAlign: "center", paddingHorizontal: rs(24) },
  retry: { color: BRAND.violet, fontSize: rs(14), fontWeight: "700" },
  loadMore: { alignItems: "center", paddingVertical: rs(16) },
  loadMoreText: { color: BRAND.violet, fontSize: rs(14), fontWeight: "600" },
});

const composerLight = {
  background: "#F7F5FB",
  card: "#FFFFFF",
  fill: "#EEEBF4",
  accentFill: "#F1EAFE",
  text: "#18181B",
  muted: "#71717A",
  separator: "#E4E1EC",
  dashed: "#C9C2DA",
};

const composerDark: typeof composerLight = {
  background: "#0F0E13",
  card: "#1C1B22",
  fill: "#26252D",
  accentFill: "#2A1A4A",
  text: "#F4F4F5",
  muted: "#A1A1AA",
  separator: "#2E2D35",
  dashed: "#52525B",
};

const composer = StyleSheet.create({
  root: { flex: 1 },
  navBar: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: rs(10) },
  navRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: rs(16), minHeight: rs(36) },
  navSide: { width: rs(70) },
  navCancel: { color: BRAND.violet, fontSize: rs(16), lineHeight: rs(21) },
  disabledText: { opacity: 0.4 },
  navTitle: { flex: 1, textAlign: "center", fontSize: rs(17), lineHeight: rs(22), fontWeight: "600", letterSpacing: -0.3 },
  content: { padding: rs(16), paddingBottom: rs(28) },
  segmented: { flexDirection: "row", borderRadius: rs(12), padding: rs(3) },
  segment: { flex: 1, minHeight: rs(38), flexDirection: "row", alignItems: "center", justifyContent: "center", gap: rs(6), borderRadius: rs(9) },
  segmentActive: softShadow(2, 0.1),
  segmentLabel: { fontSize: rs(14), lineHeight: rs(18), fontWeight: "600" },
  preview: { marginTop: rs(16), height: rs(340), borderRadius: rs(24), overflow: "hidden" },
  textPreview: { justifyContent: "center", paddingHorizontal: rs(24) },
  textInput: { fontSize: rs(26), lineHeight: rs(34), textAlign: "center", letterSpacing: -0.3, maxHeight: rs(300) },
  pickPreview: { borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: rs(6) },
  pickIcon: { width: rs(64), height: rs(64), borderRadius: rs(32), alignItems: "center", justifyContent: "center", marginBottom: rs(6) },
  pickTitle: { fontSize: rs(17), lineHeight: rs(22), fontWeight: "600" },
  pickHint: { fontSize: rs(14), lineHeight: rs(19) },
  videoBadge: {
    position: "absolute", left: rs(12), bottom: rs(12), flexDirection: "row", alignItems: "center", gap: rs(5),
    paddingHorizontal: rs(10), minHeight: rs(28), borderRadius: rs(14), backgroundColor: "rgba(0,0,0,0.45)",
  },
  previewActions: { position: "absolute", top: rs(12), left: rs(12), right: rs(12), flexDirection: "row", justifyContent: "space-between" },
  chip: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: rs(4), minHeight: rs(32), minWidth: rs(32),
    paddingHorizontal: rs(10), borderRadius: rs(16), backgroundColor: "rgba(0,0,0,0.45)",
  },
  chipText: { color: "#FFFFFF", fontSize: rs(13), fontWeight: "600" },
  swatches: { flexDirection: "row", justifyContent: "center", gap: rs(8), marginTop: rs(16) },
  swatchRing: { width: rs(40), height: rs(40), borderRadius: rs(20), borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  swatch: { width: rs(30), height: rs(30), borderRadius: rs(15) },
  fontRow: { flexDirection: "row", justifyContent: "center", gap: rs(8), marginTop: rs(12) },
  fontChip: { minHeight: rs(36), paddingHorizontal: rs(16), borderRadius: rs(18), alignItems: "center", justifyContent: "center" },
  fontChipText: { fontSize: rs(14) },
  caption: {
    marginTop: rs(16), minHeight: rs(52), maxHeight: rs(120), borderRadius: rs(16), borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: rs(16), paddingTop: rs(15), paddingBottom: rs(15), fontSize: rs(16), lineHeight: rs(21),
  },
  sectionLabel: { marginTop: rs(24), marginBottom: rs(8), marginLeft: rs(16), fontSize: rs(12.5), letterSpacing: 0.4, fontWeight: "500" },
  group: { borderRadius: rs(16), overflow: "hidden" },
  option: { flexDirection: "row", alignItems: "center", paddingLeft: rs(14) },
  optionIcon: { width: rs(32), height: rs(32), borderRadius: rs(8), alignItems: "center", justifyContent: "center" },
  optionCopy: { flex: 1, flexDirection: "row", alignItems: "center", marginLeft: rs(12), paddingVertical: rs(12), paddingRight: rs(14) },
  optionText: { flex: 1 },
  optionLabel: { fontSize: rs(16), lineHeight: rs(21) },
  optionDescription: { fontSize: rs(13), lineHeight: rs(17), marginTop: rs(1) },
  picker: { marginTop: rs(12), borderRadius: rs(16), padding: rs(12) },
  pickerTitle: { fontSize: rs(14), lineHeight: rs(19), fontWeight: "600" },
  search: { flexDirection: "row", alignItems: "center", gap: rs(6), marginTop: rs(10), borderRadius: rs(10), paddingHorizontal: rs(10), minHeight: rs(38) },
  searchInput: { flex: 1, fontSize: rs(15), paddingVertical: rs(8) },
  pickerSpinner: { marginVertical: rs(24) },
  pickerError: { alignItems: "center", gap: rs(6), paddingVertical: rs(16) },
  pickerRetry: { color: BRAND.violet, fontSize: rs(14), fontWeight: "700" },
  pickerList: { maxHeight: rs(240), marginTop: rs(8) },
  pickerRow: { flexDirection: "row", alignItems: "center", gap: rs(10), paddingVertical: rs(10), borderBottomWidth: StyleSheet.hairlineWidth },
  pickerName: { fontSize: rs(15), lineHeight: rs(20) },
  pickerEmpty: { textAlign: "center", paddingVertical: rs(20), fontSize: rs(14) },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: rs(8), marginTop: rs(16), padding: rs(12), borderRadius: rs(14), backgroundColor: "#FEF2F2" },
  errorText: { flex: 1, color: "#B91C1C", fontSize: rs(14), lineHeight: rs(19) },
  footer: { paddingHorizontal: rs(16), paddingTop: rs(12), borderTopWidth: StyleSheet.hairlineWidth },
  shareButton: { height: rs(54), borderRadius: rs(16), overflow: "hidden", justifyContent: "center" },
  shareDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
  progressFill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.22)" },
  shareContent: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: rs(8) },
  shareText: { color: "#FFFFFF", fontSize: rs(16.5), lineHeight: rs(21), fontWeight: "700", letterSpacing: -0.2 },
});
