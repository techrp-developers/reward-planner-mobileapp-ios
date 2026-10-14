import api from "../../common/auth/api/axios";
import { CHAT_API_BASE_URL } from "../../../config/apiConfig";
import { normalizeChatId, uniqueChatRecords } from "../identity";
import type {
  ChatConversation,
  ChatMessage,
  ChatPoll,
  ChatPresence,
  ChatThemeKey,
  ChatUser,
} from "../types";

/** Keep the same backend and axios authentication as the working Android client. */
type DataResponse<T> = { success: boolean; data: T; message?: string };
const chatUrl = (path: string) => `${CHAT_API_BASE_URL}/v1/chat${path}`;

// Keep this interceptor scoped to chat, and replace it on Fast Refresh.
if (__DEV__ && api.interceptors?.response) {
  const debugState = globalThis as typeof globalThis & {
    __chatDebugInterceptor?: number;
  };
  if (debugState.__chatDebugInterceptor !== undefined)
    api.interceptors.response.eject(debugState.__chatDebugInterceptor);
  debugState.__chatDebugInterceptor = api.interceptors.response.use(
    undefined,
    (error) => {
      const url = String(error?.config?.url || "");
      if (url.startsWith(chatUrl("/")))
        console.debug("[CHAT API ERROR]", {
          method: String(error?.config?.method || "").toUpperCase(),
          route: url.replace(/^https?:\/\/[^/]+/, "").split("?")[0],
          status: error?.response?.status || 0,
          code: /^[A-Z0-9_]+$/.test(String(error?.code))
            ? error.code
            : "HTTP_ERROR",
        });
      return Promise.reject(error);
    }
  );
}

export class ChatThemeUnavailableError extends Error {
  readonly code = "CHAT_THEME_UNAVAILABLE";
  constructor() {
    super(
      "Shared chat themes are not available on this server yet. Your confirmed theme has been kept."
    );
  }
}

function unwrap<T>(response: DataResponse<T>, fallback: string): T {
  if (response?.success === false)
    throw new Error(response?.message || fallback);
  return response.data;
}

export type UploadedChatImage = {
  attachment_url: string;
  attachment_name: string;
  attachment_mime_type: string;
  size: number;
};

export type GroupImageResponse = {
  conversation_id: number;
  image_url: string | null;
};

export type DeletedChatMessage = {
  message_id: number;
  conversation_id: number;
  deleted_at: string;
};

export async function fetchChatUsers(search = ""): Promise<ChatUser[]> {
  const response = await api.get<DataResponse<ChatUser[]>>(chatUrl("/users"), {
    params: search.trim() ? { search: search.trim() } : undefined,
  });
  return uniqueChatRecords(
    unwrap(response.data, "Could not load chat users.") ?? [],
    (user) => user.user_id
  );
}

export async function fetchConversations(): Promise<ChatConversation[]> {
  const response = await api.get<DataResponse<ChatConversation[]>>(
    chatUrl("/conversations")
  );
  return uniqueChatRecords(
    unwrap(response.data, "Could not load chats.") ?? [],
    (conversation) => conversation.conversation_id
  );
}

export async function fetchChatPresence(
  userIds: number[]
): Promise<ChatPresence[]> {
  const ids = [
    ...new Set(userIds.filter((id) => Number.isInteger(id) && id > 0)),
  ];
  if (!ids.length) return [];
  const response = await api.get<DataResponse<ChatPresence[]>>(
    chatUrl("/presence"),
    {
      params: { user_ids: ids.join(",") },
    }
  );
  return unwrap(response.data, "Could not load presence.") ?? [];
}

async function uploadAsset(
  endpoint: "/uploads/images" | "/uploads/documents",
  field: "image" | "document",
  asset: { uri: string; type: string; name: string },
  timeout: number
): Promise<UploadedChatImage> {
  const form = new FormData();
  form.append(field, {
    uri: asset.uri,
    type: asset.type,
    name: asset.name,
  } as any);
  const response = await api.post<DataResponse<UploadedChatImage>>(
    chatUrl(endpoint),
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout,
    }
  );
  return unwrap(response.data, "Could not upload attachment.");
}

export async function uploadChatImage(asset: {
  uri: string;
  type?: string;
  fileName?: string;
}): Promise<UploadedChatImage> {
  if (!asset.uri) throw new Error("Choose a photo first.");
  return uploadAsset(
    "/uploads/images",
    "image",
    {
      uri: asset.uri,
      type: asset.type || "image/jpeg",
      name: asset.fileName || `chat-${Date.now()}.jpg`,
    },
    60_000
  );
}

export async function uploadChatDocument(file: {
  uri: string;
  type?: string | null;
  name?: string | null;
}): Promise<UploadedChatImage> {
  if (!file.uri) throw new Error("Choose a document first.");
  return uploadAsset(
    "/uploads/documents",
    "document",
    {
      uri: file.uri,
      type: file.type || "application/octet-stream",
      name: file.name || `document-${Date.now()}`,
    },
    90_000
  );
}

export async function createConversation(
  memberIds: number[],
  name?: string
): Promise<number> {
  const ids = [
    ...new Set(
      memberIds
        .map(normalizeChatId)
        .filter((id): id is number => id !== undefined)
    ),
  ];
  if (!ids.length) throw new Error("Choose at least one person.");
  const type = ids.length === 1 && !name?.trim() ? "direct" : "group";
  if (
    type === "group" &&
    (!name?.trim() || name.trim().length > 120 || ids.length < 2)
  )
    throw new Error(
      "Enter a group name (up to 120 characters) and select at least two coworkers."
    );
  const response = await api.post<DataResponse<{ conversation_id: number }>>(
    chatUrl("/conversations"),
    {
      type,
      name: type === "group" ? name?.trim() : undefined,
      member_ids: ids,
    }
  );
  return unwrap(response.data, "Could not create conversation.")
    .conversation_id;
}

export async function fetchMessages(
  conversationId: number,
  beforeId?: number
): Promise<ChatMessage[]> {
  const response = await api.get<DataResponse<ChatMessage[]>>(
    chatUrl(`/conversations/${conversationId}/messages`),
    { params: { limit: 40, ...(beforeId ? { before_id: beforeId } : {}) } }
  );
  return unwrap(response.data, "Could not load messages.") ?? [];
}

export async function sendTextMessage(
  conversationId: number,
  body: string,
  clientMessageId: string,
  replyToMessageId?: number
): Promise<ChatMessage> {
  if (!body.trim()) throw new Error("Write a message before sending.");
  const response = await api.post<DataResponse<ChatMessage>>(
    chatUrl(`/conversations/${conversationId}/messages`),
    {
      message_type: "text",
      body: body.trim(),
      client_message_id: clientMessageId,
      ...(replyToMessageId ? { reply_to_message_id: replyToMessageId } : {}),
    }
  );
  return unwrap(response.data, "Could not send message.");
}

export async function sendImageMessage(
  conversationId: number,
  upload: UploadedChatImage,
  clientMessageId: string
): Promise<ChatMessage> {
  const response = await api.post<DataResponse<ChatMessage>>(
    chatUrl(`/conversations/${conversationId}/messages`),
    {
      message_type: "image",
      client_message_id: clientMessageId,
      attachment_url: upload.attachment_url,
      attachment_name: upload.attachment_name,
      attachment_mime_type: upload.attachment_mime_type,
    }
  );
  return unwrap(response.data, "Could not send photo.");
}

export async function sendFileMessage(
  conversationId: number,
  upload: UploadedChatImage,
  clientMessageId: string
): Promise<ChatMessage> {
  const response = await api.post<DataResponse<ChatMessage>>(
    chatUrl(`/conversations/${conversationId}/messages`),
    {
      message_type: "file",
      client_message_id: clientMessageId,
      attachment_url: upload.attachment_url,
      attachment_name: upload.attachment_name,
      attachment_mime_type: upload.attachment_mime_type,
    }
  );
  return unwrap(response.data, "Could not send document.");
}

export async function createChatPoll(
  conversationId: number,
  question: string,
  options: string[],
  clientMessageId: string
): Promise<ChatMessage> {
  const clean = options.map((item) => item.trim()).filter(Boolean);
  if (!question.trim() || clean.length < 2)
    throw new Error("Enter a question and two choices.");
  const response = await api.post<DataResponse<ChatMessage>>(
    chatUrl(`/conversations/${conversationId}/polls`),
    {
      question: question.trim(),
      options: clean,
      allow_multiple: false,
      client_message_id: clientMessageId,
    }
  );
  return unwrap(response.data, "Could not create poll.");
}

export async function voteChatPoll(
  pollId: number,
  optionIds: number[]
): Promise<ChatPoll> {
  const response = await api.post<DataResponse<ChatPoll>>(
    chatUrl(`/polls/${pollId}/votes`),
    { option_ids: optionIds }
  );
  return unwrap(response.data, "Could not submit vote.");
}

/** Android parity: group photo upload. */
export async function uploadGroupImage(
  conversationId: number,
  asset: { uri: string; type?: string; fileName?: string }
): Promise<GroupImageResponse> {
  if (!asset.uri) throw new Error("Choose a group photo first.");
  const form = new FormData();
  form.append("image", {
    uri: asset.uri,
    type: asset.type || "image/jpeg",
    name: asset.fileName || `group-${Date.now()}.jpg`,
  } as any);
  const response = await api.post<DataResponse<GroupImageResponse>>(
    chatUrl(`/conversations/${conversationId}/image`),
    form,
    { headers: { "Content-Type": "multipart/form-data" }, timeout: 60_000 }
  );
  return unwrap(response.data, "Could not update group photo.");
}

/** Android parity: remove group photo. */
export async function removeGroupImage(
  conversationId: number
): Promise<GroupImageResponse> {
  const response = await api.delete<DataResponse<GroupImageResponse>>(
    chatUrl(`/conversations/${conversationId}/image`)
  );
  return unwrap(response.data, "Could not remove group photo.");
}

/** Android parity: delete a message (server authorizes the operation). */
export async function deleteChatMessage(
  conversationId: number,
  messageId: number
): Promise<DeletedChatMessage> {
  const response = await api.delete<DataResponse<DeletedChatMessage>>(
    chatUrl(`/conversations/${conversationId}/messages/${messageId}`)
  );
  return unwrap(response.data, "Could not delete message.");
}

export async function markConversationRead(
  conversationId: number,
  messageId: number
): Promise<void> {
  await api.post(chatUrl(`/conversations/${conversationId}/read`), {
    message_id: messageId,
  });
}

export async function updateConversationTheme(
  conversationId: number,
  themeKey: ChatThemeKey
): Promise<{ conversation_id: number; theme_key: ChatThemeKey }> {
  try {
    const response = await api.patch<
      DataResponse<{ conversation_id: number; theme_key: ChatThemeKey }>
    >(chatUrl(`/conversations/${conversationId}/theme`), {
      theme_key: themeKey,
    });
    return unwrap(response.data, "Could not update chat theme.");
  } catch (error: any) {
    const message =
      typeof error?.response?.data === "string"
        ? error.response.data
        : error?.response?.data?.message || "";
    if (
      error?.response?.status === 405 ||
      (error?.response?.status === 404 &&
        /route not found|cannot patch/i.test(message))
    )
      throw new ChatThemeUnavailableError();
    throw error;
  }
}
