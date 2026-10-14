import React, { useEffect } from "react";
import { useAuth } from "../../common/auth/context/AuthContext";
import { chatSocket } from "../services/chatSocket";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ChatStackParamList } from "../types";
import ChatInboxScreen from "../screens/ChatInboxScreen";
import NewChatScreen from "../screens/NewChatScreen";
import ChatConversationScreen from "../screens/ChatConversationScreen";
import GroupInfoScreen from "../screens/GroupInfoScreen";
import MemberProfileScreen from "../screens/MemberProfileScreen";

const Stack = createNativeStackNavigator<ChatStackParamList>();

export default function ChatStack() {
  const { accessToken } = useAuth();
  useEffect(() => {
    if (accessToken) chatSocket.connect(accessToken);
    else chatSocket.disconnect();
  }, [accessToken]);
  useEffect(() => () => chatSocket.disconnect(), []);
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="ChatInbox" component={ChatInboxScreen} />
      <Stack.Screen name="NewChat" component={NewChatScreen} />
      <Stack.Screen
        name="ChatConversation"
        component={ChatConversationScreen}
      />
      <Stack.Screen name="GroupInfo" component={GroupInfoScreen} />
      <Stack.Screen name="MemberProfile" component={MemberProfileScreen} />
    </Stack.Navigator>
  );
}
