import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeStackParamList } from "./type";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function ServiceHomeStack() {
    return (
        <Stack.Navigator
            id="ServiceHomeStack"
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                gestureEnabled: true,
            }}
        >
            <Stack.Screen name="Home" getComponent={() => require("../component/screens/HomeScreen").default} />
            <Stack.Screen name="ServiceSearch" getComponent={() => require("../component/screens/ServiceSearchScreen").default} />
            <Stack.Screen name="Health" getComponent={() => require("../component/insurance/Health").default} />
            <Stack.Screen name="SuperTopUp" getComponent={() => require("../component/insurance/SuperTop").default} />
            <Stack.Screen name="PersonalAccident" getComponent={() => require("../component/insurance/PA").default} />
            <Stack.Screen
                name="Government_Document_Screen"
                getComponent={() => require("../component/screens/Government_Document_Screen").default}
            />
            <Stack.Screen
                name="ServiceDescription"
                getComponent={() => require("../component/screens/ServiceDescription").default}
            />
            <Stack.Screen name="CartScreen" getComponent={() => require("../component/screens/CartScreen").default} />
            <Stack.Screen name="Profile" getComponent={() => require("../component/screens/Profile").default} />
            <Stack.Screen
                name="MyOrder"
                getComponent={() => require("../component/order/MyOrder").default}
            />
            <Stack.Screen
                name="ServiceOrderDetail"
                getComponent={() => require("../component/order/ServiceOrderDetail").default}
            />
            <Stack.Screen
                name="ServiceCancellationRequest"
                getComponent={() => require("../component/order/ServiceCancellationRequest").default}
            />
            <Stack.Screen
                name="ServiceFeedback"
                getComponent={() => require("../component/order/ServiceFeedback").default}
            />
            <Stack.Screen
                name="WalletHistory"
                getComponent={() => require("../../ecommerce/components/home/Wallet_History").default}
            />
            <Stack.Screen
                name="TodoList"
                getComponent={() => require("../../ecommerce/profile/TodoList").default}
            />
            <Stack.Screen
                name="AddAddressMap"
                getComponent={() => require("../../ecommerce/components/ItemCardAddress/AddAddressMapScreen").default}
            />
            <Stack.Screen
                name="PrivacyPolicy"
                getComponent={() => require("../../ecommerce/profile/PrivacyPolicy").default}
            />
            <Stack.Screen
                name="TermsAndConditions"
                getComponent={() => require("../../ecommerce/profile/TermsandCondition").default}
            />
            <Stack.Screen
                name="OrderConfirmedScreen"
                getComponent={() => require("../../ecommerce/screens/OrderConfirmedScreen").default}
            />
            <Stack.Screen
                name="ServiceCheckoutScreen"
                getComponent={() => require("../component/screens/ServiceCheckoutScreen").default}
            />
            <Stack.Screen
                name="AddressSelect"
                getComponent={() => require("../../ecommerce/components/ItemCardAddress/AddressSelectScreen").default}
            />
            <Stack.Screen
                name="DocumentUpload"
                getComponent={() => require("../component/cart/DocumentUpload").default}
            />
            <Stack.Screen name="PackScreen" getComponent={() => require("../component/screens/PackScreen").default} />
            <Stack.Screen
                name="PackEnquiryForm"
                getComponent={() => require("../component/constant/BundleEnquiryForm").default}
            />
            <Stack.Screen
                name="SubmittedSuccessful"
                getComponent={() => require("../component/screens/SubmittedSuccessful").default}
            />

            {/* ── Mutual Fund Calculators ─────────────────────────────── */}
            <Stack.Screen
                name="MutualFundCalculators"
                getComponent={() => require("../component/mutualfund/MFScreen").default}
            />
            {/* ── Mutual Fund FAQ ──────────────────────────────────────── */}
            <Stack.Screen
                name="CommonQuestions"
                getComponent={() => require("../component/mutualfund/CommonQuestionsScreen").default}
            />
            <Stack.Screen
                name="FAQListing"
                getComponent={() => require("../component/mutualfund/FAQListingScreen").default}
            />
            <Stack.Screen
                name="SIPCalculator"
                getComponent={() => require("../component/mutualfund/Calculators").SIPCalculator}
            />
            <Stack.Screen
                name="GoalSIPCalculator"
                getComponent={() => require("../component/mutualfund/Calculators").GoalSIPCalculator}
            />
            <Stack.Screen
                name="SmartGoalCalculator"
                getComponent={() => require("../component/mutualfund/Calculators").SmartGoalCalculator}
            />
            <Stack.Screen
                name="InflationCalculator"
                getComponent={() => require("../component/mutualfund/Calculators").InflationCalculator}
            />
            <Stack.Screen
                name="CostOfDelayCalculator"
                getComponent={() => require("../component/mutualfund/Calculators").CostOfDelayCalculator}
            />
            <Stack.Screen
                name="LumpsumCalculator"
                getComponent={() => require("../component/mutualfund/Calculators").LumpsumCalculator}
            />
            <Stack.Screen
                name="RetirementCalculator"
                getComponent={() => require("../component/mutualfund/Calculators").RetirementCalculator}
            />
            <Stack.Screen
                name="StepUpSIPCalculator"
                getComponent={() => require("../component/mutualfund/Calculators").StepUpSIPCalculator}
            />
            <Stack.Screen
                name="SWPCalculator"
                getComponent={() => require("../component/mutualfund/Calculators").SWPCalculator}
            />
            <Stack.Screen
                name="CommonQuestionsScreen"
                getComponent={() => require("../component/mutualfund/CommonQuestionsScreen").default}
            />
            <Stack.Screen
                name="ArticleDetails"
                getComponent={() => require("../component/mutualfund/ArticleDetails").default}
            />
            <Stack.Screen
                name="MFInvestorsDetail"
                getComponent={() => require("../component/mutualfund/MFInvestorsDetail").default}
            />
            <Stack.Screen
                name="MFSectionArticles"
                getComponent={() => require("../component/mutualfund/MFSectionArticles").default}
            />
        </Stack.Navigator>
    );
}
