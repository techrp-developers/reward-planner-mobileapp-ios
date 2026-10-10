import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { ChatPoll } from '../types';

export default function PollBubble({ poll, mine, textColor, onVote }: { poll: ChatPoll; mine: boolean; textColor: string; onVote: (optionId: number) => Promise<void> }) {
  const [voting, setVoting] = useState<number | null>(null);
  const total = poll.options.reduce((sum, option) => sum + option.vote_count, 0);
  const closed = Boolean(poll.closes_at && new Date(poll.closes_at).getTime() <= Date.now());
  return <View style={styles.wrap}>
    <View style={styles.titleRow}><MaterialCommunityIcons name="poll" size={20} color={mine ? '#FFF' : '#7C3AED'} /><Text style={[styles.question, { color: textColor }]}>{poll.question}</Text></View>
    {poll.options.map(option => {
      const percent = total ? Math.round(option.vote_count * 100 / total) : 0;
      return <TouchableOpacity key={option.option_id} disabled={closed || voting !== null} style={[styles.option, { borderColor: mine ? 'rgba(255,255,255,.35)' : '#DDD6FE' }]} onPress={async () => { setVoting(option.option_id); try { await onVote(option.option_id); } finally { setVoting(null); } }}>
        <View style={[styles.progress, { width: `${percent}%`, backgroundColor: mine ? 'rgba(255,255,255,.16)' : '#EDE9FE' }]} />
        <MaterialCommunityIcons name={option.selected_by_me ? 'radiobox-marked' : 'radiobox-blank'} size={18} color={mine ? '#FFF' : '#7C3AED'} />
        <Text style={[styles.optionText, { color: textColor }]}>{option.text}</Text>
        {voting === option.option_id ? <ActivityIndicator size="small" color={mine ? '#FFF' : '#7C3AED'} /> : <Text style={[styles.count, { color: textColor }]}>{option.vote_count}</Text>}
      </TouchableOpacity>;
    })}
    <Text style={[styles.total, { color: textColor }]}>{total} vote{total === 1 ? '' : 's'}{closed ? ' • Closed' : ''}</Text>
  </View>;
}

const styles = StyleSheet.create({ wrap: { width: 245, padding: 7 }, titleRow: { flexDirection: 'row', gap: 7, alignItems: 'flex-start', marginBottom: 10 }, question: { flex: 1, fontSize: 15, fontWeight: '800' }, option: { overflow: 'hidden', minHeight: 40, borderWidth: 1, borderRadius: 12, marginBottom: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 }, progress: { position: 'absolute', left: 0, top: 0, bottom: 0 }, optionText: { flex: 1, fontSize: 13, fontWeight: '600' }, count: { fontSize: 11, fontWeight: '700' }, total: { fontSize: 10, opacity: 0.72, marginTop: 2 } });
