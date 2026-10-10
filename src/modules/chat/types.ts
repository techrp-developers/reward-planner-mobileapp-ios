export type ChatUser = {
  user_id: number;
  name: string;
  user_image?: string | null;
  department?: string | null;
  role?: string | null;
  job_role?: string | null;
};

export type ChatMember = ChatUser & { role?: 'admin' | 'member' | string };

export type ChatConversation = {
  conversation_id: number;
  type: 'direct' | 'group';
  name?: string | null;
  description?: string | null;
  theme_key?: ChatThemeKey;
  updated_at: string;
  role?: string;
  last_message_id?: number | null;
  last_message?: string | null;
  last_message_type?: 'text' | 'image' | 'file' | null;
  last_message_at?: string | null;
  last_sender_id?: number | null;
  unread_count: number;
  members: ChatMember[];
};

export type ChatMessage = {
  message_id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_image?: string | null;
  client_message_id?: string | null;
  message_type: 'text' | 'image' | 'file' | 'poll';
  body?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_mime_type?: string | null;
  reply_to_message_id?: number | null;
  edited_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  is_read?: boolean;
  read_by?: Array<{ user_id: number; name: string }>;
  poll?: ChatPoll | null;
};

export type ChatPollOption = { option_id: number; text: string; vote_count: number; selected_by_me?: boolean };
export type ChatPoll = {
  poll_id: number;
  question: string;
  allow_multiple: boolean;
  closes_at?: string | null;
  options: ChatPollOption[];
};

export type ChatPresence = {
  user_id: number;
  online: boolean;
  last_seen_at?: string | null;
};

export type ChatThemeKey = 'default' | 'violet' | 'ocean' | 'forest' | 'sunset';

export type ChatStackParamList = {
  ChatInbox: undefined;
  NewChat: undefined;
  ChatConversation: { conversation: ChatConversation };
  GroupInfo: { conversation: ChatConversation };
  MemberProfile: { member: ChatMember };
};

export type ChatSocketEvent = {
  type: 'connected' | 'conversation:available' | 'conversation:theme' | 'message:new' | 'message:read' |
    'poll:updated' | 'typing:start' | 'typing:stop' | 'presence' | 'error';
  data: any;
};
