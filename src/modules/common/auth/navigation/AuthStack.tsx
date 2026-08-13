import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "./types";

import LoginScreen from "../screens/LoginScreen";
import OTPScreen from "../screens/OTPScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = React.memo(() => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTPScreen" component={OTPScreen} />
    </Stack.Navigator>
  );
});

export default AuthStack;
