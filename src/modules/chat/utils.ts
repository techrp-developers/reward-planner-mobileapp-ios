import { normalizeLocalCmsImageUrl } from "../../config/apiConfig";
import type { ChatConversation, ChatMember } from "./types";
import { normalizeChatId, sameChatId } from "./identity";

export const chatImageUrl = (value?: string | null) =>
  normalizeLocalCmsImageUrl(value) ?? undefined;

export function otherMember(
  conversation: ChatConversation,
  currentUserId?: number
): ChatMember | undefined {
  if (
    normalizeChatId(currentUserId) === undefined ||
    !conversation.members.some((member) =>
      sameChatId(member.user_id, currentUserId)
    )
  )
    return undefined;
  return conversation.members.find(
    (member) => !sameChatId(member.user_id, currentUserId)
  );
}

export function findDirectConversation(
  conversations: ChatConversation[],
  currentUserId: unknown,
  peerId: unknown
) {
  if (
    !normalizeChatId(currentUserId) ||
    !normalizeChatId(peerId) ||
    sameChatId(currentUserId, peerId)
  )
    return undefined;
  return conversations.find((conversation) => {
    const members = new Set(
      conversation.members
        .map((member) => normalizeChatId(member.user_id))
        .filter((id) => id !== undefined)
    );
    return (
      conversation.type === "direct" &&
      members.size === 2 &&
      members.has(normalizeChatId(currentUserId)!) &&
      members.has(normalizeChatId(peerId)!)
    );
  });
}

export function conversationTitle(
  conversation: ChatConversation,
  currentUserId?: number
) {
  return conversation.type === "group"
    ? conversation.name || "Group chat"
    : otherMember(conversation, currentUserId)?.name || "Chat";
}

export function conversationMatchesQuery(conversation: ChatConversation, query: string, currentUserId?: number) {
  const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  const search = normalize(query);
  if (!search) return true;
  const names = conversation.type === "group" ? conversation.members.map(member => member.name).join(" ") : otherMember(conversation, currentUserId)?.name || "";
  return normalize(`${conversationTitle(conversation, currentUserId)} ${names} ${conversation.description || ""}`).includes(search);
}

export function initials(name?: string | null) {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function chatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

export function chatError(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback;
}
// Delete extended emoji sequences together, including flags and keycaps.
export function previousGraphemeStart(text: string, cursor: number): number {
  const prefix = text.slice(0, cursor);
  const Segmenter = (
    Intl as unknown as {
      Segmenter?: new (locale?: string, options?: { granularity: string }) => {
        segment: (value: string) => Iterable<{ index: number }>;
      };
    }
  ).Segmenter;
  if (Segmenter)
    return (
      Array.from(
        new Segmenter(undefined, { granularity: "grapheme" }).segment(prefix)
      ).pop()?.index ?? 0
    );
  const chars = Array.from(prefix);
  const modifier = (char: string) =>
    /[\p{Mark}\uFE0F\u200D]/u.test(char) ||
    (char.codePointAt(0)! >= 0x1f3fb && char.codePointAt(0)! <= 0x1f3ff);
  let last = chars.pop();
  if (
    last &&
    /[\u{1F1E6}-\u{1F1FF}]/u.test(last) &&
    chars.length &&
    /[\u{1F1E6}-\u{1F1FF}]/u.test(chars[chars.length - 1])
  )
    chars.pop();
  else
    while (
      chars.length &&
      last &&
      (modifier(last) || chars[chars.length - 1] === "\u200D")
    )
      last = chars.pop();
  return chars.join("").length;
}

export function safeChatAttachmentUrl(value?: string | null) {
  const raw = value?.trim();
  if (raw && /^https?:\/\//i.test(raw)) return raw;
  const normalized = chatImageUrl(value);
  return normalized && /^https?:\/\//i.test(normalized)
    ? normalized
    : undefined;
}

export function messageTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
}
