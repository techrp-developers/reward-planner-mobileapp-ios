import React, { useState } from "react";
import { View, StatusBar, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { useAlert } from "../../../ecommerce/components/alerts/useAlert";
import StepIndicator from "../../constant/StepIndicator";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3SuperTopUp from "./Step3SuperTopUp";
import QuotesResult from "./QuotesResult";
import { startInsurance, saveStep, mapMembersConfig, mapMembersAges } from "../../api/InsuranceApi";

export type FormData = {
  gender: string;
  members: string[];
  memberCounts: Record<string, number>;
  ages: Record<string, string | number>;
  details: {
    firstName?: string;
    lastName?: string;
    mobileNumber?: string;
    pincode?: string;
    city?: string;
    coverAmount?: string;
    agreeToTerms?: boolean;
    enquiryId?: number;
  };
};

export type QuoteData = {
  url: string;
  success: boolean;
  data?: any;
  error?: string;
};

const steps = ["Select Member", "Select Age of Members", "Basic Details"];

function SuperTop() {
  const navigation = useNavigation();
  const { success, info } = useAlert();
  const [step, setStep] = useState(0);
  const [stepLoading, setStepLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quoteResults, setQuoteResults] = useState<QuoteData[]>([]);
  const [resultCoverAmount, setResultCoverAmount] = useState(1000000);
  const [resultEnquiryId, setResultEnquiryId] = useState<number | undefined>(undefined);

  const [formData, setFormData] = useState<FormData>({
    gender: "Male",
    members: [],
    memberCounts: {},
    ages: {},
    details: {},
  });

  const ensureEnquiryId = async () => {
    const existing = formData.details?.enquiryId;
    if (existing) return existing;

    const startRes = await startInsurance("super_topup");
    const enquiryId = startRes?.enquiry_id || startRes?.enquiryId || startRes?.id;

    if (!enquiryId) {
      throw new Error("Unable to create enquiry. Please try again.");
    }

    const numId = Number(enquiryId);
    if (!Number.isFinite(numId)) {
      throw new Error("Invalid enquiry ID");
    }

    setFormData((prev) => ({
      ...prev,
      details: { ...prev.details, enquiryId: numId },
    }));

    return numId;
  };

  const handleNextStep = async () => {
    if (step !== 0 && step !== 1) return;

    setStepLoading(true);
    try {
      if (step === 0) {
        const enquiryId = await ensureEnquiryId();
        await saveStep(enquiryId, 1, "members_config", mapMembersConfig(formData));
        setStep(1);
        return;
      }

      if (step === 1) {
        const enquiryId = formData.details?.enquiryId;
        if (!enquiryId) {
          Alert.alert("Error", "Session expired. Please go back to Step 1.");
          return;
        }
        await saveStep(enquiryId, 2, "members", mapMembersAges(formData));
        setStep(2);
      }
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message || e?.message || "Failed to proceed. Please try again."
      );
    } finally {
      setStepLoading(false);
    }
  };

  const handleBackStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleShowResults = (results: any) => {
    // Handle both old format (array) and new format (object with plans, coverAmount, formData)
    if (Array.isArray(results)) {
      setQuoteResults(results);
      setResultEnquiryId(undefined);
    } else if (results.plans) {
      setQuoteResults(results.plans);
      setResultCoverAmount(results.coverAmount);
      setResultEnquiryId(results.enquiryId);
    }
    setShowResults(true);

    const successCount = Array.isArray(results)
      ? results.filter((q: any) => q.success).length
      : results.plans?.filter((q: any) => q.success).length || 0;

    success("Super Top-Up Quotes!", `Found ${successCount} customized plans for you`);
  };

  const handleBackToForm = () => {
    setShowResults(false);
    setStep(2); // Go back to Step 3
    info("Modify Details", "Update your information to fetch new quotes");
  };

  // If showing results, render QuotesResult screen
  if (showResults) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FF" />
        <QuotesResult 
          quotes={quoteResults} 
          onBack={handleBackToForm}
          coverAmount={resultCoverAmount}
          insuranceType="supertopup"
          enquiryId={resultEnquiryId}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Super Top-Up Insurance</Text>
          <Text style={styles.headerSubtitle}>
            Extra coverage with affordable premiums
          </Text>
        </View>
      </View>

      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <LinearGradient
        colors={["#F7F3FF", "#EFE7FF", "#EDE9FE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
        <StepIndicator steps={steps} currentStep={step} />

        {stepLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#8665FF" />
          </View>
        )}

        {step === 0 && (
          <Step1
            data={formData}
            setData={setFormData}
            onNext={handleNextStep}
          />
        )}

        {step === 1 && (
          <Step2
            data={formData}
            setData={setFormData}
            onNext={handleNextStep}
            onBack={handleBackStep}
          />
        )}

        {step === 2 && (
          <Step3SuperTopUp
            data={formData}
            setData={setFormData}
            onBack={handleBackStep}
            onShowResults={handleShowResults}
          />
        )}
      </LinearGradient>
    </View>
  );
}


export default SuperTop


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  backgroundGradient: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
});
