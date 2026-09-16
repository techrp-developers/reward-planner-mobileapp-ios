import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../../../query/queryClient';
import { useAuth } from '../../../common/auth/context/AuthContext';
import { useAppTheme } from '../../../../theme/ThemeContext';
import { fetchLivePolls, submitPollVote } from '../api/pollsApi';
import type { LivePoll } from '../type';

function errorMessage(error: any) {
    return error?.response?.data?.message || error?.message || 'Unable to submit your vote';
}

function LivePollCard() {
    const { isAuthenticated } = useAuth();
    const { isDark } = useAppTheme();
    const [now, setNow] = useState(Date.now());
    const [selected, setSelected] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [expanded, setExpanded] = useState(true);

    const pollsQuery = useQuery({
        queryKey: ['dashboard', 'live-polls'],
        queryFn: fetchLivePolls,
        enabled: isAuthenticated,
        staleTime: 10000,
        refetchInterval: 15000,
        refetchOnWindowFocus: true,
    });

    const poll = useMemo<LivePoll | null>(() => {
        return (pollsQuery.data ?? []).find(item => !item.closes_at || new Date(item.closes_at).getTime() > now) ?? null;
    }, [now, pollsQuery.data]);

    useEffect(() => {
        setSelected(poll?.selected_option_ids ?? []);
    }, [poll?.poll_id, poll?.selected_option_ids]);

    useEffect(() => {
        setExpanded(!poll?.has_voted);
    }, [poll?.poll_id, poll?.has_voted]);

    useEffect(() => {
        if (!poll?.closes_at) return;
        const remaining = new Date(poll.closes_at).getTime() - Date.now();
        if (remaining <= 0) { setNow(Date.now()); return; }
        const timer = setTimeout(() => {
            setNow(Date.now());
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'live-polls'] });
        }, Math.min(remaining + 100, 2147483647));
        return () => clearTimeout(timer);
    }, [poll?.closes_at]);

    const vote = useCallback(async (optionIds: number[]) => {
        if (!poll || !optionIds.length || submitting) return;
        setSubmitting(true);
        try {
            const updated = await submitPollVote(poll.poll_id, optionIds);
            queryClient.setQueryData<LivePoll[]>(['dashboard', 'live-polls'], current =>
                (current ?? []).map(item => item.poll_id === poll.poll_id && updated ? updated : item),
            );
        } catch (error: any) {
            if (error?.response?.status === 404) {
                queryClient.invalidateQueries({ queryKey: ['dashboard', 'live-polls'] });
            } else Alert.alert('Vote not submitted', errorMessage(error));
        } finally { setSubmitting(false); }
    }, [poll, submitting]);

    const choose = useCallback((optionId: number) => {
        if (!poll || submitting) return;
        if (!poll.allow_multiple) { setSelected([optionId]); vote([optionId]); return; }
        setSelected(current => current.includes(optionId) ? current.filter(id => id !== optionId) : [...current, optionId]);
    }, [poll, submitting, vote]);

    if (!poll) return null;
    const totalVotes = poll.options.reduce((sum, option) => sum + option.vote_count, 0);

    return (
        <View style={[styles.outer, { backgroundColor: isDark ? '#111B21' : '#E7F7EF' }]}>
            <View style={[styles.bubble, { backgroundColor: isDark ? '#202C33' : '#FFFFFF' }]}>
                <Pressable disabled={!poll.has_voted} onPress={() => setExpanded(value => !value)} style={styles.titleRow}>
                    <MaterialCommunityIcons name="poll" size={21} color="#25A866" />
                    <View style={styles.questionWrap}><Text numberOfLines={expanded ? undefined : 1} style={[styles.question, { color: isDark ? '#F1F5F7' : '#111B21' }]}>{poll.question}</Text>{poll.has_voted && !expanded && <Text style={styles.votedLabel}>Voted · {poll.participant_count} {poll.participant_count === 1 ? 'vote' : 'votes'}</Text>}</View>
                    {poll.has_voted && <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={23} color="#8696A0" />}
                </Pressable>
                {expanded && <>
                    <Text style={styles.hint}>{poll.allow_multiple ? 'Select one or more options' : 'Select one option'}</Text>
                    {poll.options.map(option => {
                        const checked = selected.includes(option.option_id);
                        const percent = totalVotes ? Math.round(option.vote_count * 100 / totalVotes) : 0;
                        return (
                            <Pressable key={option.option_id} disabled={submitting} onPress={() => choose(option.option_id)} style={styles.option}>
                                <View style={styles.optionTop}><MaterialCommunityIcons name={poll.allow_multiple ? (checked ? 'checkbox-marked' : 'checkbox-blank-outline') : (checked ? 'radiobox-marked' : 'radiobox-blank')} size={22} color="#25A866" /><Text style={[styles.optionText, { color: isDark ? '#E9EDEF' : '#202C33' }]}>{option.option_text}</Text><Text style={styles.percent}>{percent}%</Text></View>
                                <View style={[styles.track, { backgroundColor: isDark ? '#3B4A54' : '#E5E7EB' }]}><View style={[styles.fill, { width: `${percent}%` }]} /></View>
                            </Pressable>
                        );
                    })}
                    {poll.allow_multiple && <Pressable disabled={!selected.length || submitting} onPress={() => vote(selected)} style={[styles.voteButton, (!selected.length || submitting) && styles.voteButtonDisabled]}>{submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.voteText}>Vote</Text>}</Pressable>}
                    {!poll.allow_multiple && submitting && <ActivityIndicator style={styles.loader} size="small" color="#25A866" />}
                    <View style={styles.footer}><Text style={styles.footerText}>{poll.participant_count} {poll.participant_count === 1 ? 'vote' : 'votes'}</Text>{poll.closes_at && <Text style={styles.footerText}>Closes {new Date(poll.closes_at).toLocaleString()}</Text>}</View>
                </>}
            </View>
        </View>
    );
}

export default memo(LivePollCard);

const styles = StyleSheet.create({
    outer: { marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 7 },
    bubble: { borderRadius: 14, padding: 14, elevation: 2, shadowColor: '#000', shadowOpacity: .08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, questionWrap: { flex: 1 }, question: { fontSize: 16, lineHeight: 22, fontWeight: '700' }, votedLabel: { color: '#25A866', fontSize: 11, fontWeight: '700', marginTop: 2 }, hint: { color: '#8696A0', fontSize: 12, marginTop: 4, marginBottom: 8, marginLeft: 30 },
    option: { paddingVertical: 8 }, optionTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, optionText: { flex: 1, fontSize: 14 }, percent: { color: '#667781', fontSize: 12, fontWeight: '600' }, track: { height: 4, marginTop: 7, marginLeft: 31, borderRadius: 2, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 2, backgroundColor: '#25D366' },
    voteButton: { alignSelf: 'flex-end', minWidth: 88, height: 38, marginTop: 8, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#25A866' }, voteButtonDisabled: { opacity: .45 }, voteText: { color: '#FFF', fontWeight: '700' }, loader: { marginTop: 8 },
    footer: { marginTop: 10, paddingTop: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#8696A066', flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, footerText: { color: '#8696A0', fontSize: 10, flexShrink: 1 },
});
