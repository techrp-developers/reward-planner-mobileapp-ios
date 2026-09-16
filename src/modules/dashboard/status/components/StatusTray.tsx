import React from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { normalizeLocalCmsImageUrl } from '../../../../config/apiConfig';
import type { StatusFeedGroup, UserStatus } from '../types';

type Props = {
  visible: boolean;
  groups: StatusFeedGroup[];
  loading: boolean;
  error: boolean;
  onClose: () => void;
  onRetry: () => void;
  onViewed: (statusId: number) => void;
};

export default function StatusTray({ visible, groups, loading, error, onClose, onRetry, onViewed }: Props) {
  const [selected, setSelected] = React.useState<{ groupIndex: number; statusIndex: number } | null>(null);

  React.useEffect(() => {
    if (!visible) setSelected(null);
  }, [visible]);

  const openStatus = React.useCallback((groupIndex: number, statusIndex: number) => {
    const status = groups[groupIndex]?.statuses[statusIndex];
    if (!status) return;
    setSelected({ groupIndex, statusIndex });
    if (!status.viewed) onViewed(status.id);
  }, [groups, onViewed]);

  const advance = React.useCallback(() => {
    if (!selected) return;
    const group = groups[selected.groupIndex];
    if (selected.statusIndex + 1 < group.statuses.length) {
      openStatus(selected.groupIndex, selected.statusIndex + 1);
    } else if (selected.groupIndex + 1 < groups.length) {
      openStatus(selected.groupIndex + 1, 0);
    } else {
      setSelected(null);
    }
  }, [groups, openStatus, selected]);

  const activeStatus: UserStatus | undefined = selected
    ? groups[selected.groupIndex]?.statuses[selected.statusIndex]
    : undefined;
  const activeImage = normalizeLocalCmsImageUrl(activeStatus?.media_url);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={selected ? () => setSelected(null) : onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.heading}>{activeStatus ? activeStatus.user.name || 'Status' : 'Status updates'}</Text>
            <Pressable accessibilityLabel="Close statuses" onPress={activeStatus ? () => setSelected(null) : onClose}>
              <MaterialCommunityIcons name="close" size={26} color="#111827" />
            </Pressable>
          </View>

          {activeStatus ? (
            <Pressable style={[styles.viewer, { backgroundColor: activeStatus.background_color || '#1F2937' }]} onPress={advance}>
              {activeStatus.type === 'image' && activeImage ? (
                <Image source={{ uri: activeImage }} style={styles.viewerImage} resizeMode="contain" />
              ) : activeStatus.type === 'video' ? (
                <Text style={styles.viewerText}>Video status</Text>
              ) : (
                <Text style={styles.viewerText}>{activeStatus.text || ''}</Text>
              )}
              <Text style={styles.nextHint}>Tap to continue</Text>
            </Pressable>
          ) : loading ? (
            <ActivityIndicator style={styles.message} color="#C58A16" />
          ) : error ? (
            <Pressable style={styles.message} onPress={onRetry}>
              <Text style={styles.messageText}>Could not load statuses. Tap to retry.</Text>
            </Pressable>
          ) : groups.length === 0 ? (
            <Text style={[styles.message, styles.messageText]}>No status updates yet.</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {groups.map((group, groupIndex) => {
                const avatar = normalizeLocalCmsImageUrl(group.user.image_url);
                const unseen = group.statuses.some(status => !status.viewed);
                return (
                  <Pressable key={group.user.id} style={styles.row} onPress={() => openStatus(groupIndex, Math.max(group.statuses.findIndex(status => !status.viewed), 0))}>
                    <View style={[styles.avatarRing, { borderColor: unseen ? '#C58A16' : '#A1A1AA' }]}>
                      {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <MaterialCommunityIcons name="account" size={30} color="#6B7280" />}
                    </View>
                    <View>
                      <Text style={styles.name}>{group.user.name || 'User'}</Text>
                      <Text style={styles.subtext}>{unseen ? 'New status' : 'Viewed'}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { minHeight: 260, maxHeight: '82%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  heading: { color: '#111827', fontWeight: '800', fontSize: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  avatarRing: { width: 54, height: 54, borderWidth: 3, borderRadius: 27, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  name: { color: '#111827', fontSize: 15, fontWeight: '700' },
  subtext: { color: '#71717A', fontSize: 12, marginTop: 3 },
  message: { margin: 24, alignSelf: 'center' },
  messageText: { color: '#6B7280', textAlign: 'center' },
  viewer: { marginHorizontal: 16, height: 400, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  viewerImage: { width: '100%', height: '100%' },
  viewerText: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', textAlign: 'center', padding: 20 },
  nextHint: { position: 'absolute', bottom: 16, right: 16, color: '#FFFFFF', fontSize: 12 },
});
