import React, { memo, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useChatColors } from "./chatUiTokens";
import type { ChatPoll } from "../types";

export type PollBubbleProps = {
  poll: ChatPoll;
  mine: boolean;
  textColor: string;
  onVote: (optionId: number) => Promise<void>;
};

function PollBubble({ poll, mine, textColor, onVote }: PollBubbleProps) {
  const theme = useChatColors();
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [voting, setVoting] = useState<number | null>(null);
  const totalVotes = poll.options.reduce(
    (sum, option) => sum + Number(option.vote_count || 0),
    0
  );
  const closesAt = poll.closes_at ? new Date(poll.closes_at).getTime() : null;
  const isClosed =
    closesAt != null && Number.isFinite(closesAt) && closesAt <= now;
  useEffect(() => {
    if (closesAt === null || !Number.isFinite(closesAt) || closesAt <= now)
      return;
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(closesAt - now + 1, 2147483647)
    );
    return () => clearTimeout(timer);
  }, [closesAt, now]);
  const accent = mine ? "#FFFFFF" : theme.primary;

  async function handleVote(optionId: number) {
    if (
      isClosed ||
      (closesAt !== null && closesAt <= Date.now()) ||
      inFlight.current
    )
      return;
    inFlight.current = true;
    setVoting(optionId);
    try {
      await onVote(optionId);
      // The parent must replace/refetch the poll after the API response so
      // actual vote counts and selected_by_me are shown from server data.
    } catch (error: any) {
      Alert.alert(
        "Could not vote",
        error?.response?.data?.message || error?.message || "Please try again."
      );
    } finally {
      inFlight.current = false;
      if (mounted.current) setVoting(null);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View
          style={[
            styles.pollIcon,
            {
              backgroundColor: mine
                ? "rgba(255,255,255,.18)"
                : `${theme.primary}16`,
            },
          ]}
        >
          <MaterialCommunityIcons name="poll" size={20} color={accent} />
        </View>
        <View style={styles.headingText}>
          <Text style={[styles.question, { color: textColor }]}>
            {poll.question}
          </Text>
          <Text style={[styles.tag, { color: textColor }]}>
            {isClosed
              ? "Poll closed"
              : poll.allow_multiple
              ? "Select one or more options"
              : "Select one option"}
          </Text>
        </View>
      </View>
      {poll.options.map((option) => {
        const count = Number(option.vote_count || 0);
        const percent =
          totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const checked = Boolean(option.selected_by_me);
        const busy = voting === option.option_id;
        return (
          <Pressable
            key={option.option_id}
            disabled={isClosed || voting !== null}
            onPress={() => handleVote(option.option_id)}
            accessibilityRole={poll.allow_multiple ? "checkbox" : "radio"}
            accessibilityState={{
              checked,
              disabled: isClosed || voting !== null,
            }}
            accessibilityLabel={`${option.text}, ${percent} percent, ${count} votes`}
            style={({ pressed }) => [
              styles.option,
              {
                borderColor: checked
                  ? accent
                  : mine
                  ? "rgba(255,255,255,.40)"
                  : theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.fill,
                {
                  width: `${percent}%`,
                  backgroundColor: mine
                    ? "rgba(255,255,255,.16)"
                    : `${theme.primary}16`,
                },
              ]}
            />
            <MaterialCommunityIcons
              name={checked ? "radiobox-marked" : "radiobox-blank"}
              size={19}
              color={accent}
            />
            <Text
              numberOfLines={2}
              style={[styles.optionText, { color: textColor }]}
            >
              {option.text}
            </Text>
            {busy ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Text style={[styles.percent, { color: textColor }]}>
                {count} · {percent}%
              </Text>
            )}
          </Pressable>
        );
      })}
      <View style={styles.footer}>
        <MaterialCommunityIcons
          name="account-multiple-outline"
          size={15}
          color={textColor}
        />
        <Text style={[styles.votes, { color: textColor }]}>
          {totalVotes} vote{totalVotes === 1 ? "" : "s"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 270,
    maxWidth: "100%",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  heading: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginBottom: 14,
  },
  pollIcon: {
    height: 36,
    width: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headingText: { flex: 1 },
  question: { fontSize: 15, fontWeight: "800", lineHeight: 21 },
  tag: { fontSize: 11, opacity: 0.7, marginTop: 4 },
  option: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 9,
    flexDirection: "row",
    alignItems: "center",
  },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0 },
  optionText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  percent: { fontSize: 12, fontWeight: "800" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
    opacity: 0.75,
  },
  votes: { fontSize: 11, fontWeight: "600" },
});
export default memo(PollBubble);
