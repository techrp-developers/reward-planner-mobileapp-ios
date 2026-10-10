import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useAppTheme } from '../../../theme/ThemeContext';
import ChatAvatar from '../components/ChatAvatar';
import type { ChatMember, ChatStackParamList } from '../types';

type Route = NativeStackScreenProps<ChatStackParamList, 'GroupInfo'>['route'];
type Navigation = NativeStackNavigationProp<ChatStackParamList>;

export default function GroupInfoScreen() {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<Route>();
  const { conversation } = params;
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const members = useMemo(() => [...conversation.members].sort((left, right) => {
    const roleOrder = Number(right.role === 'admin') - Number(left.role === 'admin');
    return roleOrder || left.name.localeCompare(right.name);
  }), [conversation.members]);

  const renderMember = ({ item }: { item: ChatMember }) => {
    const isMe = Number(item.user_id) === Number(user?.user_id);
    const isAdmin = item.role === 'admin';
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name}'s profile`}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MemberProfile', { member: item })}
        style={[styles.memberRow, { borderBottomColor: theme.border }]}
      >
        <ChatAvatar name={item.name} uri={item.user_image} size={48} />
        <View style={styles.memberText}>
          <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>
            {item.name}{isMe ? ' (You)' : ''}
          </Text>
          <Text style={[styles.memberMeta, { color: theme.secondaryText }]} numberOfLines={1}>
            {[item.department, item.job_role].filter(Boolean).join(' · ') || 'Group member'}
          </Text>
        </View>
        {isAdmin ? <View style={[styles.adminBadge, { borderColor: theme.primary }]}><Text style={[styles.adminText, { color: theme.primary }]}>Group admin</Text></View> : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 7, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={25} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Group info</Text>
      </View>
      <FlatList
        data={members}
        scrollEnabled
        showsVerticalScrollIndicator
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={9}
        removeClippedSubviews
        keyExtractor={item => String(item.user_id)}
        renderItem={renderMember}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.groupSummary}>
              <ChatAvatar name={conversation.name || 'Group'} size={88} />
              <Text style={[styles.groupName, { color: theme.text }]}>{conversation.name || 'Group chat'}</Text>
              <Text style={[styles.memberCount, { color: theme.secondaryText }]}>{members.length} members</Text>
              {conversation.description ? <Text style={[styles.description, { color: theme.secondaryText }]}>{conversation.description}</Text> : null}
            </View>
            <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{members.length} participants</Text>
            </View>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', marginLeft: 6 },
  content: { paddingBottom: 30 },
  groupSummary: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },
  groupName: { marginTop: 14, fontSize: 23, fontWeight: '800', textAlign: 'center' },
  memberCount: { marginTop: 5, fontSize: 13 },
  description: { marginTop: 13, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  sectionHeader: { paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  memberRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  memberText: { flex: 1, marginLeft: 13, marginRight: 8 },
  memberName: { fontSize: 15, fontWeight: '700' },
  memberMeta: { marginTop: 4, fontSize: 12 },
  adminBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 4 },
  adminText: { fontSize: 9, fontWeight: '800' },
});
