import { normalizeLocalCmsImageUrl } from '../../config/apiConfig';
import type { ChatConversation, ChatMember } from './types';

export const chatImageUrl = (value?: string | null) => normalizeLocalCmsImageUrl(value) ?? undefined;

export function otherMember(conversation: ChatConversation, currentUserId?: number): ChatMember | undefined {
  return conversation.members.find(member => Number(member.user_id) !== Number(currentUserId));
}

export function conversationTitle(conversation: ChatConversation, currentUserId?: number) {
  return conversation.type === 'group'
    ? conversation.name || 'Group chat'
    : otherMember(conversation, currentUserId)?.name || 'Chat';
}

export function initials(name?: string | null) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

export function chatTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

export function chatError(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback;
}
