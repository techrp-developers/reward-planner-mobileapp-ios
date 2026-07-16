import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "./types";

import LoginScreen from "../screens/LoginScreen";
import AccountActivate from "../screens/AccountActivate";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import OTPScreen from "../screens/OTPScreen";
import SetNewPassword from "../screens/SetNewPassword";
import AccountActivationSuccess from "../screens/AccountActivationSuccess";
import PasswordUpdatedSuccess from "../screens/PasswordUpdatedSuccess";
import VerifyEmailScreen from "../screens/VerifyEmailScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = React.memo(() => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="AccountActivate" component={AccountActivate} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="OTPScreen" component={OTPScreen} />
      <Stack.Screen name="SetNewPassword" component={SetNewPassword} />
      <Stack.Screen name="AccountActivationSuccess" component={AccountActivationSuccess} />
      <Stack.Screen name="PasswordSuccess" component={PasswordUpdatedSuccess} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </Stack.Navigator>
  );
});

export default AuthStack;
