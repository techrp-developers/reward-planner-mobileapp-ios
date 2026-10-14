import type { ChatMessage, ChatPoll } from "./types";

export function deletedMessage(
  message: ChatMessage,
  deletedAt: string
): ChatMessage {
  return {
    ...message,
    deleted_at: deletedAt,
    body: null,
    attachment_url: null,
    attachment_name: null,
    attachment_mime_type: null,
    poll: null,
  };
}

// REST acknowledgements and socket echoes may arrive in either order.
export function mergeMessages(
  current: ChatMessage[],
  incoming: ChatMessage[]
): ChatMessage[] {
  const next = [...current];
  for (const message of incoming) {
    const matches = (item: ChatMessage) =>
      item.message_id === message.message_id ||
      Boolean(
        message.client_message_id &&
          item.client_message_id === message.client_message_id
      );
    const index = next.findIndex(matches);
    if (index < 0) next.push(message);
    else {
      const previous = next[index];
      const confirmed = next.find(
        (item) => matches(item) && item.message_id > 0
      );
      const merged =
        previous.message_id > 0 && message.message_id <= 0
          ? { ...previous }
          : {
              ...previous,
              ...message,
              is_read:
                previous.is_read || message.is_read || confirmed?.is_read,
            };
      if (message.message_id > 0) delete merged.local_status;
      next[index] =
        previous.deleted_at || message.deleted_at || confirmed?.deleted_at
          ? deletedMessage(
              merged,
              previous.deleted_at ||
                message.deleted_at ||
                confirmed!.deleted_at!
            )
          : merged;
      // An echo without a client ID can precede the HTTP acknowledgement.
      for (let duplicate = next.length - 1; duplicate > index; duplicate--) {
        if (matches(next[duplicate])) next.splice(duplicate, 1);
      }
    }
  }
  return next.sort((a, b) => {
    if (a.message_id > 0 && b.message_id > 0)
      return a.message_id - b.message_id;
    return (
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime() ||
      a.message_id - b.message_id
    );
  });
}

export function mergePollUpdate(
  previous: ChatPoll,
  incoming: ChatPoll,
  voterId: number,
  currentUserId: number | undefined,
  optionIds: number[] = []
): ChatPoll {
  return {
    ...previous,
    ...incoming,
    options: incoming.options.map((option) => ({
      ...option,
      selected_by_me:
        voterId === Number(currentUserId)
          ? optionIds.map(Number).includes(Number(option.option_id))
          : previous.options.find(
              (item) => Number(item.option_id) === Number(option.option_id)
            )?.selected_by_me,
    })),
  };
}

export function messagePreview(message: ChatMessage) {
  if (message.deleted_at) return "This message was deleted";
  if (message.message_type === "image") return "Photo";
  if (message.message_type === "file")
    return message.attachment_name || "Document";
  if (message.message_type === "poll") return message.poll?.question || "Poll";
  return message.body || "Message";
}
