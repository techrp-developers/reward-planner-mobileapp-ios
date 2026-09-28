import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HealthDashboard from "../components/screens/HealthDashboard";
import HealthClaimsScreen from "../components/screens/HealthClaimsScreen";
import StartClaimScreen from "../components/screens/StartClaimScreen";
import MyECardScreen from "../components/screens/MyECardScreen";
import FindHospitalScreen from "../components/screens/FindHospitalScreen";
import CashlessReviewScreen from "../components/screens/CashlessReviewScreen";
import ReimbursementDetailsScreen from "../components/screens/ReimbursementDetailsScreen";
import NetworkHospitalsScreen from "../components/screens/NetworkHospitalsScreen";
import ClaimEnquiryFormScreen from "../components/screens/ClaimEnquiryFormScreen";
import GmcProcessVideosScreen from "../components/screens/GmcProcessVideosScreen";

export type InssuranceStackParamList = {
  HealthDashboard: undefined;
  HealthClaimsScreen: undefined;
  StartClaimScreen: undefined;
  MyECardScreen: undefined;
  FindHospitalScreen: undefined;
  CashlessReviewScreen: undefined;
  ReimbursementDetailsScreen: undefined;
  NetworkHospitalsScreen: undefined;
  ClaimEnquiryFormScreen: { claimType: 'cashless' | 'reimbursement' };
  GmcProcessVideosScreen: undefined;
};

const Stack = createNativeStackNavigator<InssuranceStackParamList>();

export default function InssuranceStack() {
  return (
    <Stack.Navigator
      initialRouteName="HealthDashboard"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="HealthDashboard" component={HealthDashboard} />
      <Stack.Screen name="HealthClaimsScreen" component={HealthClaimsScreen} />
      <Stack.Screen name="StartClaimScreen" component={StartClaimScreen} />
      <Stack.Screen name="MyECardScreen" component={MyECardScreen} />
      <Stack.Screen name="FindHospitalScreen" component={FindHospitalScreen} />
      <Stack.Screen name="CashlessReviewScreen" component={CashlessReviewScreen} />
      <Stack.Screen name="ReimbursementDetailsScreen" component={ReimbursementDetailsScreen} />
      <Stack.Screen name="NetworkHospitalsScreen" component={NetworkHospitalsScreen} />
      <Stack.Screen name="ClaimEnquiryFormScreen" component={ClaimEnquiryFormScreen} />
      <Stack.Screen name="GmcProcessVideosScreen" component={GmcProcessVideosScreen} />
    </Stack.Navigator> 
  );
}
