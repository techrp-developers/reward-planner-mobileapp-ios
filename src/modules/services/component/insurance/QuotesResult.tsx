import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { useAlert } from "../../../ecommerce/components/alerts/useAlert";
import GradientButton from "../../constant/GradientButton";
import { selectPlan } from "../../api/InsuranceApi";

type QuoteData = {
  url: string;
  success: boolean;
  data?: any;
  error?: string;
};

type Props = {
  quotes: QuoteData[];
  onBack: () => void;
  loading?: boolean;
  coverAmount?: number;
  insuranceType?: "health" | "supertopup" | "personal_accident";
  enquiryId?: number;
};

const QuotesResult: React.FC<Props> = ({
  quotes,
  onBack,
  loading = false,
  coverAmount = 500000,
  insuranceType = "health",
  enquiryId,
}) => {
  const navigation = useNavigation<any>();
  const { warning, info } = useAlert();
  const successQuotes = quotes.filter((q) => q.success);

  const toSafeText = (value: any, fallback = ""): string => {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    return fallback;
  };

  const getDisplayCompanyName = (apiData: any, companyKey: string): string => {
    const company = apiData?.company;
    if (typeof company === "string" && company.trim()) return company;
    if (company && typeof company === "object") {
      const named =
        company.company_name ||
        company.companyName ||
        company.name ||
        company.insurerName;
      if (typeof named === "string" && named.trim()) return named;
    }

    const fallbacks = [apiData?.companyName, apiData?.insurerName, companyKey?.toUpperCase()];
    for (const item of fallbacks) {
      if (typeof item === "string" && item.trim()) return item;
    }

    return "INSURER";
  };

  const getDisplayPlanName = (apiData: any, defaultPlanName: string): string => {
    const directPlanName = toSafeText(apiData?.planName);
    if (directPlanName) return directPlanName;

    const planField = apiData?.plan;
    if (typeof planField === "string" && planField.trim()) return planField;
    if (planField && typeof planField === "object") {
      const nested =
        planField.plan_name ||
        planField.planName ||
        planField.name ||
        planField.title;
      const normalizedNested = toSafeText(nested);
      if (normalizedNested) return normalizedNested;
    }

    return defaultPlanName;
  };

  const getCompanyLogo = (apiData: any, companyKey: string): string | null => {
    if (apiData?.logoUrl) {
      const logoUrl = apiData.logoUrl;
      if (logoUrl.endsWith('.svg')) {
        return null;
      }
      return `https://policyplanner.com/super-top-up/assets/quote/${logoUrl}`;
    }
    const logoName = apiData?.company?.logo || `${companyKey}.png`;
    return `https://policyplanner.com/assets/quote/${logoName}`;
  };

  const getCompanyIcon = (companyName: string): string => {
    const name = companyName.toLowerCase();
    if (name.includes('bajaj')) return 'business';
    if (name.includes('hdfc')) return 'domain';
    if (name.includes('icici')) return 'account-balance';
    if (name.includes('star')) return 'star';
    if (name.includes('apollo')) return 'local-hospital';
    if (name.includes('aditya')) return 'shield';
    if (name.includes('care')) return 'favorite';
    return 'insurance';
  };

  const getCompanyKey = (url: string): string => {
    const parts = url.split("/");
    const index = parts.indexOf("health-insurance");
    return index !== -1 ? parts[index + 1].toLowerCase() : "general";
  };

  // Show warning if no quotes found
  React.useEffect(() => {
    if (quotes.length > 0 && successQuotes.length === 0) {
      warning("No Plans Found", "Try adjusting your coverage amount or other details");
    }
  }, [quotes.length, successQuotes.length, warning]);

  const getPremiumDisplay = (apiData: any): string => {
    if (!apiData) return "View Plan";
    
    // New format: premiums array (Super Top-Up)
    if (apiData?.premiums && Array.isArray(apiData.premiums) && apiData.premiums.length > 0) {
      const firstPremium = apiData.premiums[0];
      const lowestPremium = firstPremium?.premium || firstPremium?.value || 0;
      if (!lowestPremium || lowestPremium === 0) return "View Plan";
      return `₹${Number(lowestPremium).toLocaleString("en-IN")}`;
    }
    
    // Old format: Single premium field (Health Insurance)
    const amount = 
      apiData?.totalPayablePremium || 
      apiData?.totalBasePremium || 
      apiData?.premium || 
      apiData?.total_premium || 
      0;
    
    if (!amount || amount === 0) return "View Plan";
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  const getDeductibleDisplay = (apiData: any): string => {
    if (!apiData) return "";
    
    // New format: premiums array (Super Top-Up)
    if (apiData?.premiums && Array.isArray(apiData.premiums) && apiData.premiums.length > 0) {
      const deductible = apiData.premiums[0]?.deductible || "0";
      const deductibleNum = Number(deductible);
      if (deductibleNum === 0) return "";
      
      // Format deductible amount
      const formatAmount = (amount: number): string => {
        if (amount >= 100000) return `₹${Math.round(amount / 100000)}L`;
        return `₹${amount.toLocaleString("en-IN")}`;
      };
      
      return formatAmount(deductibleNum);
    }
    
    return "";
  };

  const getDynamicFeatures = (apiData: any): string[] => {
    if (apiData?.features && Array.isArray(apiData.features)) {
      const extractedFeatures = apiData.features
        .map((f: any) => {
          const includesText = typeof f?.includes === "string" ? f.includes.trim() : "";
          const addonsText = typeof f?.addons === "string" ? f.addons.trim() : "";
          const text = includesText || addonsText;
          return text && text.length > 2 ? text : null;
        })
        .filter((text: string | null) => text !== null)
        .slice(0, 3);
      
      return extractedFeatures.length > 0 
        ? extractedFeatures 
        : ["In-patient Hospitalization", "Pre & Post Expenses", "Modern Treatment"];
    }
    return ["In-patient Hospitalization", "Pre & Post Expenses", "Modern Treatment"];
  };

  const renderQuoteCard = ({ item }: { item: QuoteData }) => {
    const apiData = item.data; 
    const companyKey = getCompanyKey(item.url);

    const companyName = getDisplayCompanyName(apiData, companyKey);
    const defaultPlanName = insuranceType === "personal_accident" ? "Personal Accident Plan" : "Health Plan";
    const planName = getDisplayPlanName(apiData, defaultPlanName);
    const premium = getPremiumDisplay(apiData);
    const deductible = getDeductibleDisplay(apiData);
    const features = getDynamicFeatures(apiData);
    
    const formatCoverAmount = (amount: number): string => {
      if (amount >= 10000000) return `₹${Math.round(amount / 10000000)}Cr`;
      if (amount >= 100000) return `₹${Math.round(amount / 100000)}L`;
      return `₹${amount.toLocaleString("en-IN")}`;
    };
    
    // Use coverAmount from API response if available, otherwise use prop
    const displayAmount = apiData?.coverAmount || coverAmount;
    const displayCoverAmount = formatCoverAmount(displayAmount);
    const logoUrl = getCompanyLogo(apiData, companyKey);

    const getSelectedPremium = () => {
      if (apiData?.premiums?.[0]?.value) return Number(apiData.premiums[0].value) || 0;
      if (apiData?.premiums?.[0]?.premium) return Number(apiData.premiums[0].premium) || 0;
      return (
        Number(apiData?.totalPayablePremium) ||
        Number(apiData?.totalBasePremium) ||
        Number(apiData?.premium) ||
        Number(apiData?.total_premium) ||
        0
      );
    };

    const getSelectedDeductible = () => {
      return Number(apiData?.premiums?.[0]?.deductible) || 0;
    };

    const handleNavigation = async () => {
      info(companyName, `Premium: ${premium}`, 2000);

      if (enquiryId) {
        try {
          await selectPlan(enquiryId, {
            companyId: String(
              apiData?.companyId ||
              apiData?.company_id ||
              apiData?.company?.company_id ||
              apiData?.company?.companyId ||
              ""
            ),
            planId: String(
              apiData?.planId ||
              apiData?.plan_id ||
              apiData?.plan?.plan_id ||
              apiData?.plan?.planId ||
              ""
            ),
            planName,
            sum_insured: Number(apiData?.sum_insured || apiData?.coverAmount || displayAmount),
            selectedPremium: getSelectedPremium(),
            selectedDeductible: getSelectedDeductible(),
          });
        } catch (error) {
          console.warn("select-plan API failed", error);
        }
      }

      const statusText = "Enquiry Confirmed";
      const title = "Enquiry Submitted Successfully";
      const description = `${companyName} - ${planName} selected at premium ${premium}`;

      navigation.navigate("SubmittedSuccessful", {
        statusText,
        title,
        description,
        enquiryId: String(enquiryId ?? ""),
      });
    };

    return (
      <TouchableOpacity 
        style={styles.quoteCard}
        activeOpacity={0.8}
        onPress={handleNavigation}
      >
        {/* Top Section: Company Logo & Name */}
        <View style={styles.cardHeader}>
          <View style={styles.logoContainer}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={styles.companyLogo}
                resizeMode="contain"
                onError={() => {
                  // If logo fails to load, show placeholder
                }}
              />
            ) : (
              <MaterialIcons 
                name={getCompanyIcon(companyName)} 
                size={32} 
                color="#0369A1" 
              />
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyName}</Text>
          </View>
        </View>

        {/* Middle Section: Plan Details */}
        <View style={styles.cardBody}>
          <Text style={styles.planTitle}>{planName}</Text>
          
          <View style={styles.coverSection}>
            <View style={styles.coverItem}>
              <MaterialIcons name="security" size={18} color="#8665FF" />
              <View style={styles.coverDetail}>
                <Text style={styles.coverLabel}>Cover Amount</Text>
                <Text style={styles.coverValue}>{displayCoverAmount}</Text>
              </View>
            </View>
            {deductible && (
              <View style={styles.coverItem}>
                <MaterialIcons name="receipt-long" size={18} color="#8665FF" />
                <View style={styles.coverDetail}>
                  <Text style={styles.coverLabel}>Deductible</Text>
                  <Text style={styles.coverValue}>{deductible}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {features.map((feature, idx) => (
              <View key={idx} style={styles.featureItemRow}>
                <View style={styles.featureDot} />
                <Text style={styles.featureTextRow} numberOfLines={1}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Section: Price & CTA */}
        <View style={styles.cardFooter}>
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Premium/Year</Text>
            <Text style={styles.priceAmount}>{premium}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={handleNavigation}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#8665FF", "#6C4AB6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.ctaButtonText}>Enquire Now</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
            
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["#F7F3FF", "#EFE7FF", "#EDE9FE"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.backgroundGradient}
        >
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#8665FF" />
            <Text style={styles.loadingText}>Fetching 22+ Live Quotes...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#F7F3FF", "#EFE7FF", "#EDE9FE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            {insuranceType === "supertopup"
              ? "Super Top-Up Insurance"
              : insuranceType === "personal_accident"
                ? "Personal Accident Insurance"
                : "Health Insurance"}
          </Text>
          <Text style={styles.headerSubtitle}>Found {successQuotes.length} customized plans</Text>
        </View>
      </View>

      <FlatList
        data={successQuotes}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderQuoteCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <MaterialIcons name="error-outline" size={50} color="#CCC" />
            <Text style={styles.emptyText}>No plans found for this criteria.</Text>
            <GradientButton title="Adjust Details" onPress={onBack} />
          </View>
        }
      />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: "#FFFFFF" 
  },
  backgroundGradient: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: { 
    width: 40, 
    height: 40, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  headerText: { 
    flex: 1, 
    marginLeft: 12 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "800", 
    color: "#0F172A" 
  },
  headerSubtitle: { 
    fontSize: 13, 
    color: "#64748B",
    marginTop: 2,
  },
  listContent: { 
    padding: 12,
    paddingBottom: 20,
  },

  // ===== CARD STYLES =====
  quoteCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  // Header: Logo & Company Info
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 12,
  },
  companyLogo: {
    width: "90%",
    height: "90%",
    resizeMode: "contain",
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  // Body: Plan Details & Features
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  planTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 10,
    lineHeight: 20,
  },
  coverSection: {
    flexDirection: "column",
    marginBottom: 10,
    gap: 8,
  },
  coverItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  coverDetail: {
    flex: 1,
  },
  coverLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  coverValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },

  // Features List
  featuresContainer: {
    marginBottom: 0,
  },
  featureItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#8665FF",
    marginRight: 8,
  },
  featureTextRow: {
    fontSize: 12,
    color: "#475569",
    flex: 1,
    lineHeight: 16,
  },

  // Footer: Price & CTA
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    gap: 12,
  },
  priceSection: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 2,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#6C4AB6",
    letterSpacing: -0.5,
  },

  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    overflow: "hidden",
    shadowColor: "#8665FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFF",
  },

  // Old Styles (unused but kept for reference)
  featureItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 4 
  },
  featureText: { 
    fontSize: 10, 
    color: "#555", 
    marginLeft: 4, 
    flex: 1 
  },
  allFeaturesText: { 
    fontSize: 11, 
    color: "#2E7D32", 
    fontWeight: "700", 
    marginTop: 4 
  },

  // Center & Empty States
  centerContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20 
  },
  loadingText: { 
    marginTop: 15, 
    color: "#8665FF", 
    fontWeight: "700",
    fontSize: 14,
  },
  emptyText: { 
    marginVertical: 15, 
    color: "#71717A", 
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default QuotesResult;