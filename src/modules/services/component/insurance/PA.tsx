import React, { useState } from "react";
import { View, StatusBar, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { useAlert } from "../../../ecommerce/components/alerts/useAlert";
import StepIndicator from "../../constant/StepIndicator";
import Step2PA from "./Step2PA";
import Step3PA from "./Step3PA";
import QuotesResult from "./QuotesResult";
import Step1PA from "./Step1PA";
import { startInsurance, saveStep, mapMembersConfig } from "../../api/InsuranceApi";

export type FormData = {
  gender: string;
  members: string[];
  memberCounts: Record<string, number>;
  ages: Record<string, string | number>;
  details: {
    firstName?: string;
    lastName?: string;
    dob?: string;
    mobileNumber?: string;
    pincode?: string;
    city?: string;
    zone?: string;
    coverAmount?: string;
    agreeToTerms?: boolean;
    occupation?: string;
    annualIncomeRange?: string;
    natureOfWork?: string;
    enquiryId?: number;
  };
};

export type QuoteData = {
  url: string;
  success: boolean;
  data?: any;
  error?: string;
};

const steps = ["Select Self", "Basic Details", "Additional Details"];

export default function PersonalAccident() {
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
    members: ["self"],
    memberCounts: {},
    ages: {},
    details: {},
  });

  const ensureEnquiryId = async (): Promise<number> => {
    const existing = formData.details?.enquiryId;
    if (existing) return existing;

    const startRes = await startInsurance("personal_accident");
    const numId = startRes.enquiryId;

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
        // Basic details will be submitted from Step3PA via saveStep(3, "basic", ...)
        setStep(2);
      }
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message || e?.message || "Failed to proceed. Please try again.",
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

    success("PA Quotes Fetched!", `Found ${successCount} customized plans for you`);
  };

  const handleBackToForm = () => {
    setShowResults(false);
    setStep(2); // Go back to Step 3
    info("Modify Details", "Update your information to fetch new PA quotes");
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
          insuranceType="personal_accident"
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
          <Text style={styles.headerTitle}>Personal Accident Insurance</Text>
          <Text style={styles.headerSubtitle}>
            Protect your income from accidental risk
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
          <Step1PA
            data={formData}
            setData={setFormData}
            onNext={handleNextStep}
          />
        )}

        {step === 1 && (
          <Step2PA
            data={formData}
            setData={setFormData}
            onNext={handleNextStep}
            onBack={handleBackStep}
          />
        )}

        {step === 2 && (
          <Step3PA
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