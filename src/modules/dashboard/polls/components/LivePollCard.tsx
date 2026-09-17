import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from '@react-navigation/native';
import { queryClient } from '../../../../query/queryClient';
import { useAuth } from '../../../common/auth/context/AuthContext';
import { useAppTheme } from '../../../../theme/ThemeContext';
import { fetchLivePolls, submitPollVote } from '../api/pollsApi';
import type { LivePoll } from '../type';
import { rs } from '../../../../utils/responsive';

function errorMessage(error: any) {
    return error?.response?.data?.message || error?.message || 'Unable to submit your vote';
}

function LivePollCard() {
    const { isAuthenticated } = useAuth();
    const { theme } = useAppTheme();
    const isFocused = useIsFocused();
    const [now, setNow] = useState(Date.now());
    const [selected, setSelected] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const submissionInFlight = useRef(false);
    const [votedPollId, setVotedPollId] = useState<number | null>(null);

    const pollsQuery = useQuery({
        queryKey: ['dashboard', 'live-polls'],
        queryFn: fetchLivePolls,
        enabled: isAuthenticated && isFocused,
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

    const hasVoted = Boolean(poll?.has_voted || (poll && votedPollId === poll.poll_id));

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
        if (!poll || !optionIds.length || submissionInFlight.current || hasVoted) return;
        submissionInFlight.current = true;
        setSubmitting(true);
        try {
            const updated = await submitPollVote(poll.poll_id, optionIds);
            setVotedPollId(poll.poll_id);
            setSelected(optionIds);
            queryClient.setQueryData<LivePoll[]>(['dashboard', 'live-polls'], current =>
                (current ?? []).map(item => item.poll_id === poll.poll_id
                    ? updated ?? {
                        ...item,
                        has_voted: true,
                        selected_option_ids: optionIds,
                        participant_count: item.participant_count + 1,
                        options: item.options.map(option => ({
                            ...option,
                            vote_count: option.vote_count + (optionIds.includes(option.option_id) ? 1 : 0),
                        })),
                    }
                    : item),
            );
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'live-polls'] });
        } catch (error: any) {
            if (error?.response?.status === 409) {
                setVotedPollId(poll.poll_id);
                queryClient.invalidateQueries({ queryKey: ['dashboard', 'live-polls'] });
            } else Alert.alert('Vote not submitted', errorMessage(error));
        } finally { submissionInFlight.current = false; setSubmitting(false); }
    }, [poll, hasVoted]);

    const choose = useCallback((optionId: number) => {
        if (!poll || submitting || hasVoted) return;
        if (!poll.allow_multiple) { void vote([optionId]); return; }
        setSelected(current => current.includes(optionId) ? current.filter(id => id !== optionId) : [...current, optionId]);
    }, [poll, submitting, hasVoted, vote]);

    if (!poll) return null;
    const totalVotes = poll.options.reduce((sum, option) => sum + option.vote_count, 0);
    const selectedIds = hasVoted && poll.selected_option_ids?.length ? poll.selected_option_ids : selected;

    return (
        <View style={[styles.outer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.bubble}>
                <View style={styles.titleRow}>
                    <MaterialCommunityIcons name="poll" size={rs(21)} color={theme.primary} />
                    <View style={styles.questionWrap}><Text style={[styles.question, { color: theme.text }]}>{poll.question}</Text></View>
                </View>
                    <Text style={[styles.hint, { color: theme.secondaryText }]}>{hasVoted ? 'Your vote is final · Results' : poll.allow_multiple ? 'Select one or more options' : 'Select one option to vote'}</Text>
                    {poll.options.map(option => {
                        const checked = selectedIds.includes(option.option_id);
                        const percent = totalVotes ? Math.round(option.vote_count * 100 / totalVotes) : 0;
                        return (
                            <Pressable key={option.option_id} disabled={hasVoted || submitting} onPress={() => choose(option.option_id)} style={[styles.option, { borderColor: checked ? theme.primary : theme.border }]}>
                                <View style={styles.optionTop}><MaterialCommunityIcons name={checked ? 'check-circle' : 'circle-outline'} size={22} color={checked ? theme.primary : theme.secondaryText} /><Text style={[styles.optionText, { color: theme.text }]}>{option.option_text}</Text>{hasVoted && <Text style={[styles.percent, { color: theme.text }]}>{percent}%</Text>}</View>
                                {hasVoted && <View style={[styles.track, { backgroundColor: theme.border }]}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: theme.primary }]} /></View>}
                            </Pressable>
                        );
                    })}
                    {!hasVoted && poll.allow_multiple && <Pressable disabled={!selected.length || submitting} onPress={() => void vote(selected)} style={[styles.voteButton, { backgroundColor: theme.primary }, (!selected.length || submitting) && styles.voteButtonDisabled]}>{submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.voteText}>Vote</Text>}</Pressable>}
                    {!hasVoted && !poll.allow_multiple && submitting && <ActivityIndicator style={styles.loader} size="small" color={theme.primary} />}
                    <View style={[styles.footer, { borderTopColor: theme.border }]}><Text style={[styles.footerText, { color: theme.secondaryText }]}>{poll.participant_count} {poll.participant_count === 1 ? 'vote' : 'votes'}</Text>{poll.closes_at && <Text style={[styles.footerText, { color: theme.secondaryText }]}>Closes {new Date(poll.closes_at).toLocaleString()}</Text>}</View>
            </View>
        </View>
    );
}

export default memo(LivePollCard);

const styles = StyleSheet.create({
    outer: { marginHorizontal: rs(16), marginTop: rs(12), borderRadius: rs(18), borderWidth: 1 },
    bubble: { padding: rs(16) },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(9) }, questionWrap: { flex: 1 }, question: { fontSize: rs(16), lineHeight: rs(22), fontWeight: '700' }, hint: { fontSize: rs(12), marginTop: rs(6), marginBottom: rs(8), marginLeft: rs(30) },
    option: { padding: rs(10), marginTop: rs(8), borderWidth: 1, borderRadius: rs(12) }, optionTop: { flexDirection: 'row', alignItems: 'center', gap: rs(9) }, optionText: { flex: 1, fontSize: rs(14) }, percent: { fontSize: rs(12), fontWeight: '700' }, track: { height: rs(4), marginTop: rs(7), marginLeft: rs(31), borderRadius: rs(2), overflow: 'hidden' }, fill: { height: '100%', borderRadius: rs(2) },
    voteButton: { alignSelf: 'flex-end', minWidth: rs(88), height: rs(38), marginTop: rs(8), borderRadius: rs(19), alignItems: 'center', justifyContent: 'center' }, voteButtonDisabled: { opacity: .45 }, voteText: { color: '#FFF', fontWeight: '700' }, loader: { marginTop: rs(8) },
    footer: { marginTop: rs(10), paddingTop: rs(9), borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', gap: rs(8) }, footerText: { fontSize: rs(10), flexShrink: 1 },
});
