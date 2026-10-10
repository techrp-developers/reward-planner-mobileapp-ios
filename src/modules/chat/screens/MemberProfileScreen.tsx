import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useAppTheme } from '../../../theme/ThemeContext';
import ChatAvatar from '../components/ChatAvatar';
import type { ChatStackParamList } from '../types';

type Route = NativeStackScreenProps<ChatStackParamList, 'MemberProfile'>['route'];
type Navigation = NativeStackNavigationProp<ChatStackParamList>;

export default function MemberProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<Route>();
  const { member } = params;
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isMe = Number(member.user_id) === Number(user?.user_id);

  const details = [
    { icon: 'office-building-outline', label: 'Department', value: member.department },
    { icon: 'briefcase-outline', label: 'Role', value: member.job_role },
  ].filter(item => Boolean(item.value));

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 7, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={25} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
      </View>

      <View style={styles.summary}>
        <ChatAvatar name={member.name} uri={member.user_image} size={104} />
        <Text style={[styles.name, { color: theme.text }]}>{member.name}{isMe ? ' (You)' : ''}</Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
          {[member.job_role, member.department].filter(Boolean).join(' · ') || 'Coworker'}
        </Text>
        {member.role === 'admin' ? (
          <View style={[styles.adminBadge, { borderColor: theme.primary }]}>
            <MaterialCommunityIcons name="shield-account-outline" size={15} color={theme.primary} />
            <Text style={[styles.adminText, { color: theme.primary }]}>Group admin</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {details.length ? details.map((detail, index) => (
          <View key={detail.label} style={[styles.detailRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}>
            <View style={[styles.icon, { backgroundColor: `${theme.primary}18` }]}>
              <MaterialCommunityIcons name={detail.icon as any} size={22} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>{detail.label}</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{detail.value}</Text>
            </View>
          </View>
        )) : <Text style={[styles.noDetails, { color: theme.secondaryText }]}>No additional profile details available.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', marginLeft: 6 },
  summary: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 36, paddingBottom: 28 },
  name: { marginTop: 16, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { marginTop: 6, fontSize: 14, textAlign: 'center' },
  adminBadge: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  adminText: { fontSize: 11, fontWeight: '800' },
  card: { marginHorizontal: 18, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, overflow: 'hidden' },
  detailRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  detailLabel: { fontSize: 11 },
  detailValue: { marginTop: 3, fontSize: 15, fontWeight: '700' },
  noDetails: { padding: 22, textAlign: 'center', fontSize: 13 },
});
