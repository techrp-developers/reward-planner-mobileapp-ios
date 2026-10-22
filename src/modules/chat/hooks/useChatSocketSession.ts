import { useEffect } from "react";
import { useAuth } from "../../common/auth/context/AuthContext";
import { getChatUserId } from "../identity";
import { chatSocket } from "../services/chatSocket";

/**
 * Call ONCE inside the authenticated app shell (under AuthProvider), not
 * separately inside each screen. Chat screens also call ensureConnected()
 * defensively, but this hook keeps the chat socket active while a user
 * browses other sections of Reward Planners.
 */
export function useChatSocketSession() {
  const { user, isAuthenticated, accessToken } = useAuth();
  const userId = getChatUserId(user);

  useEffect(() => {
    if (!isAuthenticated || userId === undefined) {
      chatSocket.disconnect();
      return;
    }

    chatSocket.ensureConnected();
    // Handles token replacement after the auth interceptor refreshes credentials.
    // WebSocket reconnect itself remains backoff-based.
    const refresh = setInterval(() => chatSocket.ensureConnected(), 30000);
    return () => {
      clearInterval(refresh);
      // Account switching and sign-out must drop the authenticated socket.
      chatSocket.disconnect();
    };
  }, [userId, isAuthenticated]);
  useEffect(() => {
    if (isAuthenticated && userId !== undefined && accessToken)
      chatSocket.ensureConnected();
  }, [isAuthenticated, userId, accessToken]);
}
