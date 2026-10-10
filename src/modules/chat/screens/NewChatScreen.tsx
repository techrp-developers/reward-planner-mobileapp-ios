import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../theme/ThemeContext';
import { createConversation, fetchChatUsers, fetchConversations } from '../api/chatApi';
import ChatAvatar from '../components/ChatAvatar';
import type { ChatStackParamList, ChatUser } from '../types';
import { chatError } from '../utils';

type Navigation = NativeStackNavigationProp<ChatStackParamList>;

export default function NewChatScreen() {
  const navigation = useNavigation<Navigation>();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<number | null>(null);
  const [groupMode, setGroupMode] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try { setUsers(await fetchChatUsers(query.trim())); }
      catch (error) { Alert.alert('Contacts unavailable', chatError(error, 'Unable to load coworkers.')); }
      finally { setLoading(false); }
    }, query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [query]);

  const openChat = async (person: ChatUser) => {
    if (groupMode) {
      setSelected(current => current.includes(person.user_id) ? current.filter(id => id !== person.user_id) : [...current, person.user_id]);
      return;
    }
    if (creating) return;
    setCreating(person.user_id);
    try {
      const id = await createConversation([person.user_id]);
      const conversations = await fetchConversations();
      const conversation = conversations.find(item => Number(item.conversation_id) === Number(id));
      if (!conversation) throw new Error('Conversation was created but could not be loaded.');
      navigation.replace('ChatConversation', { conversation });
    } catch (error) { Alert.alert('Chat not started', chatError(error, 'Please try again.')); }
    finally { setCreating(null); }
  };

  const createGroup = async () => {
    if (selected.length < 2 || !groupName.trim() || creating) return;
    setCreating(-1);
    try {
      const id = await createConversation(selected, groupName);
      const conversations = await fetchConversations();
      const conversation = conversations.find(item => Number(item.conversation_id) === Number(id));
      if (!conversation) throw new Error('Group was created but could not be loaded.');
      navigation.replace('ChatConversation', { conversation });
    } catch (error) { Alert.alert('Group not created', chatError(error, 'Please try again.')); }
    finally { setCreating(null); }
  };

  return <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top }]}>
    <View style={styles.header}><TouchableOpacity onPress={() => groupMode ? (setGroupMode(false), setSelected([])) : navigation.goBack()} style={styles.iconButton}><MaterialCommunityIcons name="arrow-left" size={25} color={theme.text} /></TouchableOpacity><View style={styles.headerBody}><Text style={[styles.title, { color: theme.text }]}>{groupMode ? 'New group' : 'New chat'}</Text><Text style={[styles.subtitle, { color: theme.secondaryText }]}>{groupMode ? `${selected.length} selected` : `${users.length} coworkers`}</Text></View>{groupMode ? <TouchableOpacity onPress={createGroup} disabled={selected.length < 2 || !groupName.trim() || creating !== null} style={[styles.createButton, { backgroundColor: selected.length >= 2 && groupName.trim() ? theme.primary : theme.border }]}><Text style={styles.createText}>Create</Text></TouchableOpacity> : null}</View>
    {!groupMode ? <TouchableOpacity style={[styles.groupRow, { borderColor: theme.border }]} onPress={() => setGroupMode(true)}><View style={[styles.groupIcon, { backgroundColor: theme.primary }]}><MaterialCommunityIcons name="account-group-outline" size={23} color="#FFF" /></View><Text style={[styles.groupText, { color: theme.text }]}>New group</Text></TouchableOpacity> : <TextInput value={groupName} onChangeText={setGroupName} placeholder="Group name" placeholderTextColor={theme.secondaryText} maxLength={120} style={[styles.groupName, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]} />}
    <View style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border }]}><MaterialCommunityIcons name="magnify" size={22} color={theme.secondaryText} /><TextInput value={query} onChangeText={setQuery} placeholder="Search coworkers" placeholderTextColor={theme.secondaryText} style={[styles.input, { color: theme.text }]} autoFocus /></View>
    {loading ? <ActivityIndicator style={styles.loader} color={theme.primary} /> : null}
    <FlatList data={users} keyExtractor={item => String(item.user_id)} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list} renderItem={({ item }) => <TouchableOpacity style={[styles.person, { borderBottomColor: theme.border }]} onPress={() => openChat(item)} disabled={creating !== null}><ChatAvatar name={item.name} uri={item.user_image} size={48} /><View style={styles.personBody}><Text style={[styles.personName, { color: theme.text }]}>{item.name}</Text><Text style={[styles.personMeta, { color: theme.secondaryText }]} numberOfLines={1}>{[item.department, item.role].filter(Boolean).join(' • ') || 'Coworker'}</Text></View>{creating === item.user_id ? <ActivityIndicator color={theme.primary} /> : groupMode ? <MaterialCommunityIcons name={selected.includes(item.user_id) ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={25} color={selected.includes(item.user_id) ? theme.primary : theme.secondaryText} /> : null}</TouchableOpacity>} ListEmptyComponent={!loading ? <Text style={[styles.empty, { color: theme.secondaryText }]}>No coworkers found</Text> : null} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 }, headerBody: { flex: 1 }, iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 21, fontWeight: '800' }, subtitle: { fontSize: 12, marginTop: 2 }, createButton: { borderRadius: 18, paddingHorizontal: 15, paddingVertical: 9 }, createText: { color: '#FFF', fontWeight: '800' }, groupRow: { marginHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth }, groupIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, groupText: { flex: 1, fontSize: 16, fontWeight: '700' }, groupName: { marginHorizontal: 18, height: 48, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 }, search: { marginHorizontal: 18, marginVertical: 8, height: 48, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }, input: { flex: 1, fontSize: 15, paddingVertical: 0 }, loader: { marginTop: 16 }, list: { paddingHorizontal: 18, paddingBottom: 30 }, person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth }, personBody: { flex: 1 }, personName: { fontSize: 16, fontWeight: '700' }, personMeta: { fontSize: 12, marginTop: 4 }, empty: { textAlign: 'center', marginTop: 54 },
});
